import type {
  BrowserAiStatus,
  BuiltInGlobal,
  ChromeAiCapabilities,
  ChromeAiCapabilityKey,
  ChromeAiCapabilityState,
  ChromeBuiltInApi,
  ChromePromptSession,
  ChromeTaskSession
} from "./types";

export const capabilityApiNames: Record<ChromeAiCapabilityKey, keyof BuiltInGlobal> = {
  prompt: "LanguageModel",
  summarize: "Summarizer",
  translate: "Translator",
  detectLanguage: "LanguageDetector",
  rewrite: "Rewriter",
  write: "Writer",
  proofread: "Proofreader"
};

export const emptyCapabilities: ChromeAiCapabilities = {
  prompt: "unsupported",
  summarize: "unsupported",
  translate: "unsupported",
  detectLanguage: "unsupported",
  rewrite: "unsupported",
  write: "unsupported",
  proofread: "unsupported"
};

export function getApi<TSession extends ChromeTaskSession | ChromePromptSession>(
  key: ChromeAiCapabilityKey
): ChromeBuiltInApi<TSession> | undefined {
  const g = globalThis as any;
  const legacyAi = g.ai || (typeof window !== "undefined" ? (window as any).ai : undefined);

  if (key === "prompt") {
    if (g.LanguageModel) return g.LanguageModel;
    if (legacyAi?.languageModel) return legacyAi.languageModel;
    if (legacyAi?.assistant) return legacyAi.assistant;
  }
  if (key === "summarize") {
    if (g.Summarizer) return g.Summarizer;
    if (legacyAi?.summarizer) return legacyAi.summarizer;
  }
  if (key === "translate") {
    if (g.Translator) return g.Translator;
    if (legacyAi?.translator) return legacyAi.translator;
  }
  if (key === "detectLanguage") {
    if (g.LanguageDetector) return g.LanguageDetector;
    if (legacyAi?.languageDetector) return legacyAi.languageDetector;
  }
  if (key === "rewrite") {
    if (g.Rewriter) return g.Rewriter;
    if (legacyAi?.rewriter) return legacyAi.rewriter;
  }
  if (key === "write") {
    if (g.Writer) return g.Writer;
    if (legacyAi?.writer) return legacyAi.writer;
  }
  if (key === "proofread") {
    if (g.Proofreader) return g.Proofreader;
    if (legacyAi?.proofreader) return legacyAi.proofreader;
  }

  return (globalThis as BuiltInGlobal)[capabilityApiNames[key]] as ChromeBuiltInApi<TSession> | undefined;
}

export function mapAvailability(value: unknown): ChromeAiCapabilityState {
  if (!value) return "unavailable";
  if (typeof value === "object" && value !== null && "available" in value) {
    return mapAvailability((value as any).available);
  }

  const normalized = String(value || "").toLowerCase().trim();

  // Modern and legacy Chrome availability values
  if (normalized === "available" || normalized === "readily" || normalized === "yes" || normalized === "true") {
    return "available";
  }
  if (normalized === "downloadable" || normalized === "after-download") {
    return "downloadable";
  }
  if (normalized === "downloading" || normalized === "download_in_progress") {
    return "downloading";
  }
  if (normalized === "unavailable" || normalized === "no" || normalized === "none" || normalized === "false") {
    return "unavailable";
  }

  return "unavailable";
}

export function overallStatus(capabilities: ChromeAiCapabilities): BrowserAiStatus {
  const states = Object.values(capabilities);
  if (states.includes("available")) return "available";
  if (states.includes("downloading")) return "downloading";
  if (states.includes("downloadable")) return "downloadable";
  if (states.includes("error")) return "error";
  if (states.includes("unavailable")) return "unavailable";
  return "unsupported";
}

export function isTerminalUnavailable(status: BrowserAiStatus): boolean {
  return status === "unsupported" || status === "unavailable" || status === "error";
}

export async function detectChromeAiCapabilities(): Promise<ChromeAiCapabilities> {
  const entries = await Promise.all(
    (Object.keys(capabilityApiNames) as ChromeAiCapabilityKey[]).map(async (key) => {
      const api = getApi(key);
      if (!api?.create) return [key, "unsupported" as const] satisfies [ChromeAiCapabilityKey, ChromeAiCapabilityState];

      try {
        if (typeof api.availability === "function") {
          const res = await api.availability({});
          return [key, mapAvailability(res)] satisfies [ChromeAiCapabilityKey, ChromeAiCapabilityState];
        }
        if (typeof (api as any).capabilities === "function") {
          const caps = await (api as any).capabilities();
          const avail = caps?.available ?? caps;
          return [key, mapAvailability(avail)] satisfies [ChromeAiCapabilityKey, ChromeAiCapabilityState];
        }
        return [key, "available" as const] satisfies [ChromeAiCapabilityKey, ChromeAiCapabilityState];
      } catch {
        return [key, "error" as const] satisfies [ChromeAiCapabilityKey, ChromeAiCapabilityState];
      }
    })
  );

  const finalCapabilities = {
    ...emptyCapabilities,
    ...Object.fromEntries(entries)
  } as ChromeAiCapabilities;

  if (typeof window !== "undefined") {
    console.info("[A1-Chan Built-in AI State]", {
      overall: overallStatus(finalCapabilities),
      capabilities: finalCapabilities,
      hasLanguageModel: Boolean((globalThis as any).LanguageModel),
      hasAiNamespace: Boolean((globalThis as any).ai)
    });
  }

  return finalCapabilities;
}

export async function detectBrowserAiStatus(): Promise<BrowserAiStatus> {
  return overallStatus(await detectChromeAiCapabilities());
}
