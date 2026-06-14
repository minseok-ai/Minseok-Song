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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { query, context } = body;

    const routes = createNavigatorRoutes(visibleNavigationItems(), pageEntriesById);
    const knowledgeCards = createA1ChanKnowledge({
      routes,
      pages: pageEntries,
      projects: projectEntries,
      writings: writingEntries,
      contacts: contactEntries
    });

    const staticResult = createStaticA1ChanResponse(query || "", routes, knowledgeCards, {
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
    console.error("A1 Chan search error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
