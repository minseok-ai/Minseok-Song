import type { NavigatorRoute } from "./route-engine";
import type { A1ChanKnowledgeCard } from "./site-knowledge";
import type {
  A1ChanAction,
  A1ChanContextPack,
  A1ChanResult
} from "./shared";
import {
  clarifyActions,
  currentPageRecord,
  manualResult,
  resultFromCard
} from "./engine/answers";
import { detectIntent, detectLanguage } from "./engine/intent";
import {
  retrievalScoresFromMatches,
  retrieveA1ChanContext,
  retrieveA1ChanMatches
} from "./engine/retrieval";
import type { A1ChanContext, A1ChanIntent } from "./engine/types";
import { normalizeNavigatorText } from "./route-engine";

export type {
  A1ChanAction,
  A1ChanContext,
  A1ChanContextPack,
  A1ChanIntent,
  A1ChanResult
};

function siteScopeMessage() {
  return "저는 이 사이트의 공개 콘텐츠를 근거로 답합니다. 인물/경력, A1 Firms, 프로젝트, 글, 연락 경로를 물어보면 가장 잘 답할 수 있어요.";
}

function cardById(cards: A1ChanKnowledgeCard[], id?: string | null) {
  return id ? cards.find((card) => card.id === id) : undefined;
}

function firstRouteCard(cards: A1ChanKnowledgeCard[], routeId: string) {
  return cards.find((card) => card.kind === "page" && card.routeId === routeId) ||
    cards.find((card) => card.routeId === routeId);
}

function concreteKindWeight(card: A1ChanKnowledgeCard) {
  if (card.kind === "project") return 4;
  if (card.kind === "person") return 4;
  if (card.kind === "contact") return 4;
  if (card.kind === "writing") return 3;
  if (card.kind === "section") return 2;
  return 1;
}

function entityMatchScore(query: string, card: A1ChanKnowledgeCard) {
  const normalized = normalizeNavigatorText(query);
  if (!normalized) return 0;

  const entityTerms = [card.id, card.title, ...card.aliases]
    .map(normalizeNavigatorText)
    .filter((term) => term.length >= 3);

  let score = 0;
  for (const term of entityTerms) {
    if (normalized === term) {
      score = Math.max(score, 1000 + concreteKindWeight(card) * 20 + term.length);
    } else if (normalized.includes(term)) {
      score = Math.max(score, 760 + concreteKindWeight(card) * 20 + term.length);
    } else if (term.includes(normalized) && normalized.length >= 3) {
      score = Math.max(score, 520 + concreteKindWeight(card) * 20 + normalized.length);
    }
  }

  return score;
}

function hasExplicitRecordReference(query: string, cards: A1ChanKnowledgeCard[]) {
  const normalized = normalizeNavigatorText(query);
  if (!normalized) return false;

  return cards.some((card) =>
    [card.id, card.title, ...card.aliases]
      .map(normalizeNavigatorText)
      .filter((term) => term.length >= 3)
      .some((term) => normalized.includes(term))
  );
}

function preferStrongEntityMatches(query: string, cards: A1ChanKnowledgeCard[]) {
  const ranked = cards
    .map((card, index) => ({ card, index, score: entityMatchScore(query, card) }))
    .sort((a, b) => b.score - a.score || b.card.priority - a.card.priority || a.index - b.index);

  if ((ranked[0]?.score ?? 0) < 500) {
    return cards;
  }

  return ranked.map((item) => item.card);
}

function preferredCardForIntent(intent: A1ChanIntent, query: string, cards: A1ChanKnowledgeCard[], context: A1ChanContext) {
  if (intent === "currentPage") return currentPageRecord(cards, context.currentRouteId);
  if (intent === "summary") {
    if (hasExplicitRecordReference(query, cards)) return undefined;
    return cardById(cards, context.lastRecordId) ?? currentPageRecord(cards, context.currentRouteId);
  }
  if (intent === "detail") {
    if (hasExplicitRecordReference(query, cards)) return undefined;
    return cardById(cards, context.lastRecordId);
  }
  if (intent === "confusion") return cardById(cards, context.lastRecordId);
  if (intent === "person") return cards.find((card) => card.id === "person-minseok-song");
  if (intent === "contact") return cards.find((card) => card.kind === "contact");
  if (intent === "writing") return firstRouteCard(cards, "writings");
  return undefined;
}

function coerceHintIntent(value: unknown): A1ChanIntent | undefined {
  const allowed: A1ChanIntent[] = [
    "currentPage",
    "person",
    "contact",
    "projectCollection",
    "compare",
    "recommendation",
    "summary",
    "smalltalk",
    "confusion",
    "detail",
    "siteQuestion",
    "capability",
    "writing",
    "open",
    "knowledgeQuestion"
  ];

  return allowed.includes(value as A1ChanIntent) ? value as A1ChanIntent : undefined;
}

function semanticSearchQuery(query: string, context: A1ChanContext) {
  const entities = context.semanticHint?.entities ?? [];
  return [query, ...entities].join(" ").trim();
}

function isWeakFullTextOnlyMatch(match: ReturnType<typeof retrieveA1ChanMatches>[number]) {
  return match.reasons.length === 1 && match.reasons[0] === "full-text";
}

function gateWeakKnowledgeMatches(
  matches: ReturnType<typeof retrieveA1ChanMatches>,
  intent: A1ChanIntent,
  context: A1ChanContext
) {
  if (intent !== "knowledgeQuestion" || context.semanticHint?.intent) {
    return matches;
  }

  const gated = matches.filter((match) => !isWeakFullTextOnlyMatch(match));
  return gated.length ? gated : [];
}

function actionsForRoute(routes: NavigatorRoute[], routeId: string, label?: string) {
  const route = routes.find((item) => item.id === routeId) ?? routes[0];
  return route
    ? [{ label: label ?? `${route.label} 보기`, href: route.path, routeId: route.id }]
    : [];
}

function createCapabilityResult(query: string, routes: NavigatorRoute[], cards: A1ChanKnowledgeCard[], context: A1ChanContext): A1ChanResult {
  const detectedLanguage = detectLanguage(query);
  const assistantCard = cards.find((card) => card.id === "assistant-a1-chan");
  const siteCard = assistantCard ?? cards.find((card) => card.id === "site-overview");
  return manualResult({
    query,
    intent: "capability",
    mode: "answer",
    answerParts: [
      { text: "A1 Chan은 이 사이트의 공개 콘텐츠를 근거로 답하고, 관련 화면과 다음 액션을 같이 이어주는 사이트 concierge입니다." },
      { label: "잘하는 질문", text: "인물/경력, A1 Firms, 프로젝트 설명, 글 위치, 연락 경로, 현재 페이지 요약에 강합니다." },
      { label: "범위", text: "외부 웹 검색이나 비공개 정보 추측은 하지 않고, Chrome Built-in AI가 가능할 때도 같은 근거 안에서 표현만 부드럽게 만듭니다." }
    ],
    routes,
    context,
    detectedLanguage,
    routeId: "home",
    cards: siteCard ? [siteCard] : [],
    actions: clarifyActions(routes),
    confidence: "high"
  });
}

function createSmalltalkResult(query: string, routes: NavigatorRoute[], cards: A1ChanKnowledgeCard[], context: A1ChanContext): A1ChanResult {
  const detectedLanguage = detectLanguage(query);
  const siteCard = cards.find((card) => card.id === "assistant-a1-chan") ?? cards.find((card) => card.id === "site-overview");
  return manualResult({
    query,
    intent: "smalltalk",
    mode: "smalltalk",
    answerParts: [
      { text: "안녕하세요. 저는 A1 Chan입니다." },
      { label: "바로 도와드릴 수 있는 것", text: "RA1, A1trategize, Minseok Song의 경력, 프로젝트 분류, 글, 연락 경로처럼 사이트 안의 공개 정보를 찾아서 설명할 수 있어요." }
    ],
    routes,
    context,
    detectedLanguage,
    routeId: context.currentRouteId ?? "home",
    cards: siteCard ? [siteCard] : [],
    actions: clarifyActions(routes),
    confidence: "medium"
  });
}

function createEmptyResult(query: string, routes: NavigatorRoute[], cards: A1ChanKnowledgeCard[], context: A1ChanContext): A1ChanResult {
  const detectedLanguage = detectLanguage(query);
  const siteCard = cards.find((card) => card.id === "site-overview");
  return manualResult({
    query,
    intent: "empty",
    mode: "clarify",
    answerParts: [
      { text: `A1 Chan입니다. ${siteScopeMessage()}` },
      { label: "예시", text: `"RA1 설명해줘", "이 사람은 누구야?", "A1trategize가 뭐야?", "글은 어디서 봐?"처럼 물어볼 수 있습니다.` }
    ],
    routes,
    context,
    detectedLanguage,
    cards: siteCard ? [siteCard] : [],
    actions: clarifyActions(routes),
    confidence: "low"
  });
}

function createNoMatchResult(query: string, routes: NavigatorRoute[], context: A1ChanContext): A1ChanResult {
  const detectedLanguage = detectLanguage(query);
  const fallbackRouteId = context.currentRouteId ?? "projects";
  return manualResult({
    query,
    intent: "knowledgeQuestion",
    mode: "clarify",
    answerParts: [
      { text: "아직 사이트 DB에서 정확히 맞는 항목을 찾지 못했습니다." },
      { label: "다시 물어보기", text: `${siteScopeMessage()} 프로젝트 이름, 기술 키워드, 연락/경력처럼 조금만 좁혀서 물어보면 더 정확합니다.` }
    ],
    routes,
    context,
    detectedLanguage,
    routeId: fallbackRouteId,
    actions: clarifyActions(routes),
    confidence: "low",
    qualityFlags: ["no-matched-record"]
  });
}

export function retrieveStaticA1ChanContext(
  query: string,
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext,
  intent: A1ChanIntent,
  limit = 6
) {
  return retrieveA1ChanContext(query, knowledgeCards, context, intent, limit);
}

export function createStaticA1ChanResponse(
  query: string,
  routes: NavigatorRoute[],
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext = {}
): A1ChanResult {
  const trimmed = query.trim();
  const intent = coerceHintIntent(context.semanticHint?.intent) ?? detectIntent(trimmed);
  const detectedLanguage = context.semanticHint?.language ?? detectLanguage(trimmed);
  const searchQuery = semanticSearchQuery(trimmed, context);

  if (intent === "empty") {
    return createEmptyResult(trimmed, routes, knowledgeCards, context);
  }

  if (intent === "capability") {
    return createCapabilityResult(trimmed, routes, knowledgeCards, context);
  }

  if (intent === "smalltalk") {
    return createSmalltalkResult(trimmed, routes, knowledgeCards, context);
  }

  const preferred = preferredCardForIntent(intent, searchQuery, knowledgeCards, context);
  if (preferred) {
    const relatedMatches = retrieveA1ChanMatches(searchQuery, knowledgeCards, context, intent, 8);
    const related = relatedMatches.map((match) => match.card);
    const merged = [preferred, ...related.filter((card) => card.id !== preferred.id)];
    return resultFromCard(trimmed, intent, preferred, merged, routes, {
      ...context,
      retrievalScores: retrievalScoresFromMatches(relatedMatches)
    }, detectedLanguage);
  }

  let retrievedMatches = gateWeakKnowledgeMatches(
    retrieveA1ChanMatches(searchQuery, knowledgeCards, context, intent, 10),
    intent,
    context
  );
  let retrieved = retrievedMatches.map((match) => match.card);
  retrieved = preferStrongEntityMatches(searchQuery, retrieved);

  if (intent === "projectCollection" || intent === "recommendation") {
    const specificProject = retrieved.find((card) => card.kind === "project" && entityMatchScore(searchQuery, card) >= 500);

    if (specificProject) {
      retrieved = [specificProject, ...retrieved.filter((card) => card.id !== specificProject.id)];
    } else {
      const collection = knowledgeCards.find((card) => card.id === "projects-collection");
      const projects = knowledgeCards.filter((card) => card.kind === "project");
      retrieved = collection ? [collection, ...projects] : projects;
    }
  }

  if (intent === "compare") {
    const projectCards = retrieved.filter((card) => card.kind === "project");
    const fallbackProjects = knowledgeCards
      .filter((card) => card.kind === "project")
      .sort((a, b) => b.priority - a.priority);
    retrieved = projectCards.length >= 2
      ? projectCards
      : [...projectCards, ...fallbackProjects.filter((card) => !projectCards.some((item) => item.id === card.id))].slice(0, 4);
  }

  if (intent === "writing" && !retrieved.some((card) => card.routeId === "writings")) {
    const writingsPage = firstRouteCard(knowledgeCards, "writings");
    if (writingsPage) {
      retrieved = [writingsPage, ...retrieved.filter((card) => card.id !== writingsPage.id)];
    }
  }

  if (intent === "confusion") {
    const current = currentPageRecord(knowledgeCards, context.currentRouteId);
    if (current) {
      retrieved = [current, ...retrieved.filter((card) => card.id !== current.id)];
    }
  }

  const primary = retrieved[0];
  if (primary) {
    if (primary.id === "projects-collection") {
      const projects = knowledgeCards.filter((card) => card.kind === "project");
      retrieved = [primary, ...projects];
    }
    return resultFromCard(trimmed, intent, primary, retrieved, routes, {
      ...context,
      retrievalScores: retrievalScoresFromMatches(retrievedMatches)
    }, detectedLanguage);
  }

  const routeOnlyIntent = intent === "open" || intent === "writing";
  if (routeOnlyIntent && intent === "writing") {
    return manualResult({
      query: trimmed,
      intent,
      mode: "navigate",
      answerParts: [
        { text: "글과 뉴스레터는 Writings 화면에서 볼 수 있습니다." },
        { label: "다음 액션", text: "아래 Writings 버튼을 열면 공개된 글 목록으로 이어집니다." }
      ],
      routes,
      context,
      detectedLanguage,
      routeId: "writings",
      actions: actionsForRoute(routes, "writings", "Writings 열기"),
      confidence: "medium"
    });
  }

  return createNoMatchResult(trimmed, routes, context);
}
