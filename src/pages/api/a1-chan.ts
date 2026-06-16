import type { APIRoute } from "astro";
import { visibleNavigationItems } from "../../config/navigation";
import {
  contactEntries,
  pageEntries,
  pageEntriesById,
  projectEntries,
  writingEntries
} from "../../lib/content/registry";
import { createNavigatorRoutes } from "../../features/a1-chan/route-engine";
import { createA1ChanKnowledge } from "../../features/a1-chan/site-knowledge";
import { createStaticA1ChanResponse } from "../../features/a1-chan/conversation-engine";
import { createRateLimiter, createRateLimitHeaders, getClientIdentifier } from "../../lib/rate-limiter";

const rateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 300,
});

type A1ChanRequestBody = {
  query?: unknown;
  context?: {
    currentRouteId?: unknown;
    lastRouteId?: unknown;
    lastRecordId?: unknown;
    userHistory?: unknown;
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
    writings: writingEntries,
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
  return {
    currentRouteId: cleanString(context.currentRouteId, 80) || undefined,
    lastRouteId: cleanString(context.lastRouteId, 80) || undefined,
    lastRecordId: cleanString(context.lastRecordId, 140) || undefined,
    userHistory: Array.isArray(context.userHistory)
      ? context.userHistory.map((item) => cleanString(item, 180)).filter(Boolean).slice(-4)
      : []
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
    const { routes, knowledgeCards } = getA1ChanStaticContext();

    const staticResult = createStaticA1ChanResponse(query, routes, knowledgeCards, {
      ...context,
      source: "static"
    });

    return new Response(JSON.stringify({
      contextPack: staticResult.contextPack,
      staticResult
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
