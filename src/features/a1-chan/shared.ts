import type { NavigatorConfidence, NavigatorResultSource } from "./route-engine";
import type { A1ChanKnowledgeCard } from "./site-knowledge";

export type A1ChanMode = "answer" | "navigate" | "clarify" | "smalltalk";

export type A1ChanAction = {
  label: string;
  href: string;
  routeId?: string;
};

export type A1ChanResult = {
  mode: A1ChanMode;
  answer: string;
  routeId?: string;
  routeHref?: string;
  confidence: NavigatorConfidence;
  deepLink?: string;
  actions: A1ChanAction[];
  contextCards: A1ChanKnowledgeCard[];
  source: NavigatorResultSource;
  reason?: string;
};

export function sanitizeA1ChanAnswer(value: unknown) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 720);
}

export function coerceA1ChanMode(value: unknown): A1ChanMode {
  return value === "answer" || value === "navigate" || value === "clarify" || value === "smalltalk"
    ? value
    : "answer";
}
