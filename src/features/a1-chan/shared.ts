import type { NavigatorConfidence, NavigatorResultSource } from "./route-engine";
import type { A1ChanKnowledgeCard } from "./site-knowledge";

export type A1ChanMode = "answer" | "navigate" | "clarify" | "smalltalk";

export type A1ChanAction = {
  label: string;
  href: string;
  routeId?: string;
};

export type A1ChanAnswerPart = {
  label?: string;
  text: string;
};

export type A1ChanSourceCard = {
  id: string;
  kind: A1ChanKnowledgeCard["kind"];
  title: string;
  href: string;
  source: string;
};

export type A1ChanContextPack = {
  query: string;
  locale: "ko";
  currentRouteId?: string | null;
  intent: string;
  primaryRecord?: A1ChanKnowledgeCard;
  matchedRecords: A1ChanKnowledgeCard[];
  evidence: string[];
  suggestedActions: A1ChanAction[];
  confidence: NavigatorConfidence;
  detectedLanguage?: "ko" | "en" | "ja" | "unknown";
  suggestedQuestions?: string[];
  qualityFlags?: string[];
};

export type A1ChanResult = {
  mode: A1ChanMode;
  answer: string;
  answerParts?: A1ChanAnswerPart[];
  routeId?: string;
  routeHref?: string;
  confidence: NavigatorConfidence;
  deepLink?: string;
  actions: A1ChanAction[];
  contextCards: A1ChanKnowledgeCard[];
  sourceCards?: A1ChanSourceCard[];
  suggestedQuestions?: string[];
  qualityFlags?: string[];
  detectedLanguage?: "ko" | "en" | "ja" | "unknown";
  contextPack?: A1ChanContextPack;
  source: NavigatorResultSource;
  reason?: string;
};

export function sanitizeA1ChanAnswer(value: unknown) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

export function coerceA1ChanMode(value: unknown): A1ChanMode {
  return value === "answer" || value === "navigate" || value === "clarify" || value === "smalltalk"
    ? value
    : "answer";
}
