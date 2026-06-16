import type { NavigatorResultSource } from "../route-engine";

export type A1ChanContext = {
  currentRouteId?: string | null;
  lastRouteId?: string | null;
  lastRecordId?: string | null;
  userHistory?: string[];
  source?: NavigatorResultSource;
};

export type A1ChanIntent =
  | "empty"
  | "currentPage"
  | "person"
  | "contact"
  | "projectCollection"
  | "smalltalk"
  | "confusion"
  | "detail"
  | "siteQuestion"
  | "capability"
  | "writing"
  | "open"
  | "knowledgeQuestion";

export type A1ChanDetectedLanguage = "ko" | "en" | "ja" | "unknown";
