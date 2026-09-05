import { A1_CHAN_SYSTEM_PROMPT } from "../prompts/runtime-profile";
import { getApi, isTerminalUnavailable, mapAvailability, overallStatus } from "./api-detector";
import type {
  BrowserAiStatus,
  ChromeAiCapabilities,
  ChromeCreateOptions,
  ChromePromptSession
} from "./types";

export type SessionManagerCallbacks = {
  onStatus?: (status: BrowserAiStatus) => void;
  onCapabilities?: (capabilities: ChromeAiCapabilities) => void;
  onDownloadProgress?: (progress: number) => void;
};

const SESSION_CONNECT_TIMEOUT_MS = 6000;

export class ChromeAiSessionManager {
  private promptSession: ChromePromptSession | null = null;
  private promptSessionPromise: Promise<ChromePromptSession | null> | null = null;
  private availabilityChecked = false;
  private isDownloading = false;

  constructor(
    private capabilities: ChromeAiCapabilities,
    private callbacks: SessionManagerCallbacks
  ) {}

  public getSession(): ChromePromptSession | null {
    return this.promptSession;
  }

  public getCapabilities(): ChromeAiCapabilities {
    return this.capabilities;
  }

  public getStatus(): BrowserAiStatus {
    return overallStatus(this.capabilities);
  }

  public setCapabilities(nextCapabilities: ChromeAiCapabilities) {
    this.capabilities = nextCapabilities;
    this.callbacks.onCapabilities?.(this.capabilities);
    this.callbacks.onStatus?.(overallStatus(this.capabilities));
  }

  public async checkAvailability(): Promise<BrowserAiStatus> {
    const api = getApi<ChromePromptSession>("prompt");
    if (!api?.create) {
      this.setCapabilities({ ...this.capabilities, prompt: "unsupported" });
      return "unsupported";
    }

    try {
      if (typeof api.availability === "function") {
        const res = await api.availability({});
        const mapped = mapAvailability(res);
        this.setCapabilities({ ...this.capabilities, prompt: mapped });
        this.availabilityChecked = true;
        return overallStatus(this.capabilities);
      }
      if (typeof (api as any).capabilities === "function") {
        const caps = await (api as any).capabilities();
        const avail = caps?.available ?? caps;
        const mapped = mapAvailability(avail);
        this.setCapabilities({ ...this.capabilities, prompt: mapped });
        this.availabilityChecked = true;
        return overallStatus(this.capabilities);
      }
      this.setCapabilities({ ...this.capabilities, prompt: "available" });
      this.availabilityChecked = true;
      return "available";
    } catch {
      this.setCapabilities({ ...this.capabilities, prompt: "error" });
      this.availabilityChecked = true;
      return "error";
    }
  }

  /**
   * Prepares the Prompt API session.
   * @param userGesture boolean - true if triggered by user interaction (click, submit, etc.)
   */
  public async prepare(userGesture = false): Promise<boolean> {
    if (this.promptSession) {
      this.setCapabilities({ ...this.capabilities, prompt: "available" });
      return true;
    }

    if (!this.availabilityChecked) {
      await this.checkAvailability();
    }

    const currentPromptState = this.capabilities.prompt;
    if (
      currentPromptState === "unsupported" ||
      currentPromptState === "unavailable" ||
      currentPromptState === "error" ||
      isTerminalUnavailable(this.getStatus())
    ) {
      return false;
    }

    // Security & User Gesture Policy:
    // If model requires downloading, do NOT trigger download without a user gesture.
    if (currentPromptState === "downloadable" && !userGesture) {
      return false;
    }

    if (this.promptSessionPromise) {
      // If actively downloading, do not block with a short timeout; return false so fallback works
      if (this.isDownloading) {
        return false;
      }
      return Boolean(await this.withTimeout(this.promptSessionPromise, SESSION_CONNECT_TIMEOUT_MS));
    }

    const createdSession = await this.createPromptSession();
    return Boolean(createdSession);
  }

  public async getPromptSession(): Promise<ChromePromptSession | null> {
    if (this.promptSession) return this.promptSession;

    // If download is currently in progress, immediately return null to allow seamless server fallback
    if (this.isDownloading) {
      return null;
    }

    if (this.promptSessionPromise) {
      return await this.withTimeout(this.promptSessionPromise, SESSION_CONNECT_TIMEOUT_MS);
    }

    const prepared = await this.prepare(true);
    return prepared ? this.promptSession : null;
  }

  private async createPromptSession(): Promise<ChromePromptSession | null> {
    const api = getApi<ChromePromptSession>("prompt");
    if (!api?.create) {
      this.setCapabilities({ ...this.capabilities, prompt: "unsupported" });
      return null;
    }

    const monitorCallback = (monitor: any) => {
      if (!monitor) return;
      monitor.addEventListener?.("downloadprogress", (event: any) => {
        this.isDownloading = true;
        this.setCapabilities({ ...this.capabilities, prompt: "downloading" });
        if (typeof event.loaded === "number" && typeof event.total === "number" && event.total > 0) {
          const ratio = Math.min(1, Math.max(0, event.loaded / event.total));
          this.callbacks.onDownloadProgress?.(ratio);
        }
      });
    };

    // Modern Chrome: Use `systemPrompt` cleanly. Avoid passing both `initialPrompts` and `systemPrompt` simultaneously.
    const modernOptions: ChromeCreateOptions = {
      systemPrompt: A1_CHAN_SYSTEM_PROMPT,
      monitor: monitorCallback
    };

    this.promptSessionPromise = (async () => {
      let session: ChromePromptSession | undefined;

      try {
        // Attempt 1: Modern Chrome Prompt API spec
        session = await api.create(modernOptions);
      } catch (errModern) {
        // Attempt 2: Legacy fallback with initialPrompts
        try {
          session = await api.create({
            initialPrompts: [{ role: "system", content: A1_CHAN_SYSTEM_PROMPT }],
            monitor: monitorCallback
          });
        } catch {
          // Attempt 3: Bare create
          try {
            session = await api.create();
          } catch (errFinal) {
            console.warn("[A1-Chan Built-in AI] Session creation failed:", errFinal);
            this.isDownloading = false;
            this.setCapabilities({ ...this.capabilities, prompt: "error" });
            return null;
          }
        }
      }

      if (session) {
        this.promptSession = session;
        this.isDownloading = false;
        console.info("[A1-Chan Built-in AI] Session ready! Switched status to available (Local AI).");
        this.setCapabilities({ ...this.capabilities, prompt: "available" });
        return session;
      }

      this.isDownloading = false;
      return null;
    })().finally(() => {
      this.promptSessionPromise = null;
    });

    // If downloading, don't wait indefinitely; return the promise handle
    if (this.isDownloading) {
      return null;
    }

    return await this.withTimeout(this.promptSessionPromise, SESSION_CONNECT_TIMEOUT_MS);
  }

  public destroy() {
    this.promptSession?.destroy?.();
    this.promptSession = null;
    this.promptSessionPromise = null;
    this.isDownloading = false;
    this.setCapabilities({ ...this.capabilities, prompt: "unsupported" });
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => resolve(null), timeoutMs);
      promise
        .then((value) => {
          window.clearTimeout(timer);
          resolve(value);
        })
        .catch(() => {
          window.clearTimeout(timer);
          resolve(null);
        });
    });
  }
}
