import { sanitizeA1ChanAnswer } from "../shared";
import {
  detectBrowserAiStatus,
  detectChromeAiCapabilities,
  emptyCapabilities
} from "./api-detector";
import {
  buildAnswerPlanPrompt,
  buildAnswerPlanResponseConstraint,
  buildConversationPrompt,
  buildConversationResponseConstraint,
  buildRoutingPrompt,
  buildRoutingResponseConstraint,
  buildSemanticHintPrompt,
  buildSemanticHintResponseConstraint
} from "./prompt-builder";
import {
  coerceAnswerPlan,
  coerceSemanticHint,
  parseJsonObject,
  preservesNumericFacts,
  respectsLockedRecords,
  resultFromModelJson
} from "./response-parser";
import { ChromeAiSessionManager } from "./session-manager";
import type {
  A1ChanResult,
  A1ChanSemanticHint,
  BrowserAiResolveContext,
  ChromeBuiltInRuntimeOptions,
  NavigatorIntentResult
} from "./types";

export * from "./types";
export * from "./api-detector";
export * from "./prompt-builder";
export * from "./response-parser";
export * from "./session-manager";

const PROMPT_TIMEOUT_MS = 4200;

export function createChromeBuiltInRuntime({
  routes,
  onStatus,
  onCapabilities,
  onDownloadProgress
}: ChromeBuiltInRuntimeOptions) {
  const sessionManager = new ChromeAiSessionManager({ ...emptyCapabilities }, {
    onStatus,
    onCapabilities,
    onDownloadProgress
  });

  const routingResponseConstraint = buildRoutingResponseConstraint(routes);
  const semanticHintResponseConstraint = buildSemanticHintResponseConstraint();
  const conversationResponseConstraint = buildConversationResponseConstraint();

  const checkAvailability = async () => {
    return await sessionManager.checkAvailability();
  };

  const prepare = async (userGesture = false) => {
    return await sessionManager.prepare(userGesture);
  };

  const resolve = async (
    query: string,
    context: BrowserAiResolveContext = {}
  ): Promise<NavigatorIntentResult | null> => {
    if (!query.trim()) return null;
    const session = await sessionManager.getPromptSession();
    if (!session) return null;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PROMPT_TIMEOUT_MS);

    try {
      const raw = await session.prompt(buildRoutingPrompt(query, routes, context), {
        signal: controller.signal,
        responseConstraint: routingResponseConstraint
      });
      const parsed = parseJsonObject(raw);
      return parsed ? resultFromModelJson(parsed, query, routes) : null;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const resolveSemanticHint = async (
    query: string,
    context: BrowserAiResolveContext = {}
  ): Promise<A1ChanSemanticHint | null> => {
    if (!query.trim()) return null;
    const session = await sessionManager.getPromptSession();
    if (!session) return null;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PROMPT_TIMEOUT_MS);

    try {
      const raw = await session.prompt(buildSemanticHintPrompt(query, routes, context), {
        signal: controller.signal,
        responseConstraint: semanticHintResponseConstraint
      });
      const parsed = parseJsonObject(raw);
      return parsed ? coerceSemanticHint(parsed) : null;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const resolveAnswerPlan = async (query: string, context: BrowserAiResolveContext, seed: A1ChanResult) => {
    const session = await sessionManager.getPromptSession();
    if (!session) return null;

    const evidenceIds = (seed.contextPack?.matchedRecords ?? seed.contextCards).map((card) => card.id);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PROMPT_TIMEOUT_MS);

    try {
      const raw = await session.prompt(buildAnswerPlanPrompt(query, seed, context), {
        signal: controller.signal,
        responseConstraint: buildAnswerPlanResponseConstraint(evidenceIds)
      });
      const parsed = parseJsonObject(raw);
      return parsed ? coerceAnswerPlan(parsed, seed) : null;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const resolveConversation = async (
    query: string,
    context: BrowserAiResolveContext,
    seed: A1ChanResult
  ): Promise<A1ChanResult | null> => {
    if (!query.trim()) return null;
    const session = await sessionManager.getPromptSession();
    if (!session) return null;

    const answerPlan = (await resolveAnswerPlan(query, context, seed)) ?? seed.answerPlan ?? seed.contextPack?.answerPlan;
    if (!answerPlan) return null;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PROMPT_TIMEOUT_MS);

    try {
      const raw = await session.prompt(buildConversationPrompt(query, seed, answerPlan, routes, context), {
        signal: controller.signal,
        responseConstraint: conversationResponseConstraint
      });
      const parsed = parseJsonObject(raw);
      if (!parsed) return null;

      const answer = sanitizeA1ChanAnswer(parsed.answer);
      if (!answer) return null;
      if (!preservesNumericFacts(seed.answer, answer)) return null;
      if (!respectsLockedRecords(seed, answer)) return null;

      return {
        ...seed,
        answer,
        answerParts: [{ text: answer }],
        answerPlan,
        source: "chrome-ai",
        reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 160) : seed.reason
      };
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const destroy = () => {
    sessionManager.destroy();
  };

  return {
    checkAvailability,
    prepare,
    resolve,
    resolveSemanticHint,
    resolveConversation,
    destroy,
    get status() {
      return sessionManager.getStatus();
    },
    get capabilities() {
      return sessionManager.getCapabilities();
    }
  };
}

export { detectChromeAiCapabilities, detectBrowserAiStatus };
