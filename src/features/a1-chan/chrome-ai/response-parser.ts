import {
  buildNavigatorResult,
  coerceConfidence,
  selectDeepLink,
  type NavigatorIntentResult,
  type NavigatorRoute
} from "../route-engine";
import type { A1AnswerPlan, A1ChanResult, A1ChanSemanticHint } from "./types";

export function parseJsonObject(raw: string) {
  const text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isAllowedDeepLink(route: NavigatorRoute, value: unknown): value is string {
  return typeof value === "string" && route.deepLinks.some((link) => link.hash === value);
}

export function preservesNumericFacts(seedAnswer: string, rewrittenAnswer: string) {
  const numericFacts = Array.from(new Set(seedAnswer.match(/\d+\s*(?:개|건|명|년|%|KRW|원|MSE)/gi) ?? []));
  return numericFacts.every((fact) => rewrittenAnswer.includes(fact));
}

export function respectsLockedRecords(seed: A1ChanResult, rewrittenAnswer: string) {
  if (!seed.lockedNotices?.length && !seed.contextPack?.lockedNotices?.length) return true;

  return !/(AZ5214|V2O5|NCM811|SORONA|rpm|mJ\/cm|sccm|hard contact|O2 descum|50nm|100nm|150W|300W|600W|700W)/i.test(
    rewrittenAnswer
  );
}

export function resultFromModelJson(
  parsed: Record<string, unknown>,
  query: string,
  routes: NavigatorRoute[]
): NavigatorIntentResult | null {
  const route = routes.find((item) => item.id === parsed.routeId);
  if (!route) return null;

  const confidence = coerceConfidence(parsed.confidence);
  const inferredDeepLink = selectDeepLink(query, route)?.hash;
  const deepLink = isAllowedDeepLink(route, parsed.deepLink) ? parsed.deepLink : inferredDeepLink;
  const result = buildNavigatorResult(route, confidence, "chrome-ai", deepLink);

  if (typeof parsed.reason === "string") {
    result.reason = parsed.reason.slice(0, 160);
  }

  return result;
}

export function coerceArrayOfStrings(value: unknown, limit: number): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, limit)
    : [];
}

export function coerceAnswerMode(value: unknown): A1AnswerPlan["answerMode"] {
  return value === "summary" ||
    value === "comparison" ||
    value === "recommendation" ||
    value === "navigation" ||
    value === "clarify" ||
    value === "direct"
    ? value
    : "direct";
}

export function coerceAnswerPlan(parsed: Record<string, unknown>, seed: A1ChanResult): A1AnswerPlan | null {
  const fallback = seed.answerPlan ?? seed.contextPack?.answerPlan;
  if (!fallback) return null;

  const allowedEvidenceIds = new Set((seed.contextPack?.matchedRecords ?? seed.contextCards).map((card) => card.id));
  const evidenceIds = coerceArrayOfStrings(parsed.evidenceIds, 6).filter((id) => allowedEvidenceIds.has(id));

  return {
    intent: typeof parsed.intent === "string" ? parsed.intent.slice(0, 80) : fallback.intent,
    language:
      parsed.language === "ko" || parsed.language === "en" || parsed.language === "ja" || parsed.language === "unknown"
        ? parsed.language
        : fallback.language,
    entities: coerceArrayOfStrings(parsed.entities, 6),
    targetSection: typeof parsed.targetSection === "string" ? parsed.targetSection.slice(0, 80) : fallback.targetSection,
    evidenceIds: evidenceIds.length ? evidenceIds : fallback.evidenceIds,
    answerMode: coerceAnswerMode(parsed.answerMode),
    routeAction: fallback.routeAction ?? null,
    blockedFacts: Array.from(new Set([...fallback.blockedFacts, ...coerceArrayOfStrings(parsed.blockedFacts, 4)])),
    confidence: coerceConfidence(parsed.confidence),
    followups: coerceArrayOfStrings(parsed.followups, 3).length
      ? coerceArrayOfStrings(parsed.followups, 3)
      : fallback.followups
  };
}

export function coerceSemanticHint(parsed: Record<string, unknown>): A1ChanSemanticHint {
  return {
    intent: typeof parsed.intent === "string" ? parsed.intent.slice(0, 80) : undefined,
    language:
      parsed.language === "ko" || parsed.language === "en" || parsed.language === "ja" || parsed.language === "unknown"
        ? parsed.language
        : undefined,
    entities: coerceArrayOfStrings(parsed.entities, 6),
    targetRouteId: typeof parsed.targetRouteId === "string" ? parsed.targetRouteId.slice(0, 80) : undefined,
    answerMode: coerceAnswerMode(parsed.answerMode),
    confidence: coerceConfidence(parsed.confidence)
  };
}
