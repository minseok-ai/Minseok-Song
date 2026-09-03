import type { APIRoute } from "astro";
import { visibleNavigationItems } from "../../config/navigation";
import {
  contactEntries,
  pageEntries,
  pageEntriesById,
  projectEntries
} from "../../lib/content/registry";
import { createNavigatorRoutes } from "../../features/a1-chan/route-engine";
import { createA1ChanKnowledge } from "../../features/a1-chan/site-knowledge";
import { createStaticA1ChanResponse } from "../../features/a1-chan/conversation-engine";
import type { A1ChanSemanticHint } from "../../features/a1-chan/shared";
import { createRateLimiter, createRateLimitHeaders, getClientIdentifier } from "../../lib/rate-limiter";

const rateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 300,
});

type A1ChanRequestBody = {
  query?: unknown;
  semanticHint?: {
    intent?: unknown;
    language?: unknown;
    entities?: unknown;
    targetRouteId?: unknown;
    answerMode?: unknown;
    confidence?: unknown;
  };
  context?: {
    currentRouteId?: unknown;
    lastRouteId?: unknown;
    lastRecordId?: unknown;
    userHistory?: unknown;
    affect?: {
      octantId?: unknown;
      octantCode?: unknown;
      name?: unknown;
      color?: unknown;
      tone?: unknown;
      valence?: unknown;
      arousal?: unknown;
      dominance?: unknown;
    };
  };
};

let cachedContext:
  | {
      routes: ReturnType<typeof createNavigatorRoutes>;
      knowledgeCards: ReturnType<typeof createA1ChanKnowledge>;
    }
  | undefined;

function getA1ChanStaticContext() {
  if (cachedContext) return cachedContext;

  const routes = createNavigatorRoutes(visibleNavigationItems(), pageEntriesById);
  const knowledgeCards = createA1ChanKnowledge({
    routes,
    pages: pageEntries,
    projects: projectEntries,
    contacts: contactEntries
  });

  cachedContext = { routes, knowledgeCards };
  return cachedContext;
}

function cleanString(value: unknown, maxLength = 260) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanContext(value: A1ChanRequestBody["context"] = {}) {
  const context = value && typeof value === "object" ? value : {};
  const rawAffect = context.affect && typeof context.affect === "object" ? context.affect : undefined;
  const affect = rawAffect ? {
    octantId: typeof rawAffect.octantId === "number" ? rawAffect.octantId : undefined,
    octantCode: cleanString(rawAffect.octantCode, 20) || undefined,
    name: cleanString(rawAffect.name, 80) || undefined,
    color: cleanString(rawAffect.color, 20) || undefined,
    tone: cleanString(rawAffect.tone, 140) || undefined,
    valence: typeof rawAffect.valence === "number" ? rawAffect.valence : undefined,
    arousal: typeof rawAffect.arousal === "number" ? rawAffect.arousal : undefined,
    dominance: typeof rawAffect.dominance === "number" ? rawAffect.dominance : undefined,
  } : undefined;

  return {
    currentRouteId: cleanString(context.currentRouteId, 80) || undefined,
    lastRouteId: cleanString(context.lastRouteId, 80) || undefined,
    lastRecordId: cleanString(context.lastRecordId, 140) || undefined,
    userHistory: Array.isArray(context.userHistory)
      ? context.userHistory.map((item) => cleanString(item, 180)).filter(Boolean).slice(-4)
      : [],
    affect
  };
}

function cleanSemanticHint(value: A1ChanRequestBody["semanticHint"]): A1ChanSemanticHint | undefined {
  if (!value || typeof value !== "object") return undefined;

  const language = value.language === "ko" || value.language === "en" || value.language === "ja" || value.language === "unknown"
    ? value.language
    : undefined;
  const confidence = value.confidence === "high" || value.confidence === "medium" || value.confidence === "low"
    ? value.confidence
    : undefined;
  const answerMode = value.answerMode === "direct" ||
    value.answerMode === "summary" ||
    value.answerMode === "comparison" ||
    value.answerMode === "recommendation" ||
    value.answerMode === "navigation" ||
    value.answerMode === "clarify"
    ? value.answerMode
    : undefined;

  return {
    intent: cleanString(value.intent, 80) || undefined,
    language,
    entities: Array.isArray(value.entities)
      ? value.entities.map((item) => cleanString(item, 120)).filter(Boolean).slice(0, 6)
      : [],
    targetRouteId: cleanString(value.targetRouteId, 80) || undefined,
    answerMode,
    confidence
  };
}

export const POST: APIRoute = async ({ request }) => {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = rateLimiter(identifier);

  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...createRateLimitHeaders(rateLimitResult),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as A1ChanRequestBody;
    const query = cleanString(body.query);
    const context = cleanContext(body.context);
    const semanticHint = cleanSemanticHint(body.semanticHint);
    const { routes, knowledgeCards } = getA1ChanStaticContext();

    const staticResult = createStaticA1ChanResponse(query, routes, knowledgeCards, {
      ...context,
      semanticHint,
      source: "static"
    });

    return new Response(JSON.stringify({
      contextPack: staticResult.contextPack,
      staticResult,
      evidenceCards: staticResult.contextPack?.evidenceCards ?? staticResult.sourceCards ?? [],
      retrievalScores: staticResult.contextPack?.retrievalScores ?? staticResult.retrievalScores ?? [],
      lockedNotices: staticResult.contextPack?.lockedNotices ?? staticResult.lockedNotices ?? [],
      suggestedActions: staticResult.contextPack?.suggestedActions ?? staticResult.actions ?? []
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("A1 Chan conversation API error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
