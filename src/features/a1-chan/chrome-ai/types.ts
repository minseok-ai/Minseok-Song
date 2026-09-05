import type { NavigatorConfidence, NavigatorIntentResult, NavigatorRoute } from "../route-engine";
import type {
  A1AnswerPlan,
  A1ChanResult,
  A1ChanSemanticHint,
  ChromeAiCapabilities,
  ChromeAiCapabilityKey,
  ChromeAiCapabilityState
} from "../shared";

export type BrowserAiStatus = ChromeAiCapabilityState;

export type ChromePromptSession = {
  prompt: (input: string, options?: Record<string, unknown>) => Promise<string>;
  promptStreaming?: (input: string, options?: Record<string, unknown>) => ReadableStream<string>;
  destroy?: () => void;
};

export type ChromeTaskSession = {
  summarize?: (input: string, options?: Record<string, unknown>) => Promise<string>;
  detect?: (input: string, options?: Record<string, unknown>) => Promise<unknown>;
  translate?: (input: string, options?: Record<string, unknown>) => Promise<string>;
  write?: (input: string, options?: Record<string, unknown>) => Promise<string>;
  rewrite?: (input: string, options?: Record<string, unknown>) => Promise<string>;
  proofread?: (input: string, options?: Record<string, unknown>) => Promise<unknown>;
  destroy?: () => void;
};

export type ChromeDownloadProgressEvent = Event & {
  loaded?: number;
  total?: number;
};

export type ChromeCapabilityMonitor = EventTarget & {
  addEventListener: (type: "downloadprogress", listener: (event: ChromeDownloadProgressEvent) => void) => void;
};

export type ChromeCreateOptions = {
  systemPrompt?: string;
  expectedInputs?: Array<{ type: "text"; languages: string[] }>;
  expectedOutputs?: Array<{ type: "text"; languages: string[] }>;
  initialPrompts?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  monitor?: (monitor: ChromeCapabilityMonitor) => void;
  signal?: AbortSignal;
  [key: string]: unknown;
};

export type ChromeBuiltInApi<TSession extends ChromeTaskSession | ChromePromptSession = ChromeTaskSession> = {
  availability?: (options?: ChromeCreateOptions) => Promise<string> | string;
  create?: (options?: ChromeCreateOptions) => Promise<TSession>;
};

export type BuiltInGlobal = typeof globalThis & {
  LanguageModel?: ChromeBuiltInApi<ChromePromptSession>;
  Summarizer?: ChromeBuiltInApi<ChromeTaskSession>;
  Translator?: ChromeBuiltInApi<ChromeTaskSession>;
  LanguageDetector?: ChromeBuiltInApi<ChromeTaskSession>;
  Writer?: ChromeBuiltInApi<ChromeTaskSession>;
  Rewriter?: ChromeBuiltInApi<ChromeTaskSession>;
  Proofreader?: ChromeBuiltInApi<ChromeTaskSession>;
};

export type ChromeBuiltInRuntimeOptions = {
  routes: NavigatorRoute[];
  onStatus?: (status: BrowserAiStatus) => void;
  onCapabilities?: (capabilities: ChromeAiCapabilities) => void;
  onDownloadProgress?: (progress: number) => void;
};

export type BrowserAiResolveContext = {
  currentRouteId?: string | null;
  lastRouteId?: string | null;
  lastRecordId?: string | null;
  userHistory?: string[];
  affect?: {
    valence?: number;
    arousal?: number;
    dominance?: number;
    centroid?: [number, number, number];
    octantId?: number;
    octantCode?: string;
    name?: string;
    tone?: string;
    color?: string;
  };
};

export type {
  NavigatorConfidence,
  NavigatorIntentResult,
  NavigatorRoute,
  A1AnswerPlan,
  A1ChanResult,
  A1ChanSemanticHint,
  ChromeAiCapabilities,
  ChromeAiCapabilityKey,
  ChromeAiCapabilityState
};
