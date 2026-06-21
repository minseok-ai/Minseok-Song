import type { NavigatorResultSource } from "../route-engine";
import type { A1ChanRetrievalScore, A1ChanSemanticHint } from "../shared";

export type A1ChanContext = {
  currentRouteId?: string | null;
  lastRouteId?: string | null;
  lastRecordId?: string | null;
  userHistory?: string[];
  retrievalScores?: A1ChanRetrievalScore[];
  semanticHint?: A1ChanSemanticHint;
  source?: NavigatorResultSource;
};

export type A1ChanIntent =
  | "empty"
  | "currentPage"
  | "person"
  | "contact"
  | "projectCollection"
  | "compare"
  | "recommendation"
  | "summary"
  | "smalltalk"
  | "confusion"
  | "detail"
  | "siteQuestion"
  | "capability"
  | "writing"
  | "open"
  | "knowledgeQuestion";

export type A1ChanDetectedLanguage = "ko" | "en" | "ja" | "unknown";
