import {
  normalizeNavigatorText,
  selectDeepLink,
  type NavigatorConfidence,
  type NavigatorResultSource,
  type NavigatorRoute
} from "./route-engine";
import type { A1ChanKnowledgeCard } from "./site-knowledge";
import MiniSearch from "minisearch";
import type {
  A1ChanMode,
  A1ChanAction,
  A1ChanResult
} from "./shared";

export type {
  A1ChanMode,
  A1ChanAction,
  A1ChanResult
};

type A1ChanContext = {
  currentRouteId?: string | null;
  lastRouteId?: string | null;
  userHistory?: string[];
  source?: NavigatorResultSource;
};

type IntentKey = "currentPage" | "person" | "confusion" | "smalltalk" | "contact";

const intentTerms: Record<IntentKey, string[]> = {
  currentPage: [
    "이 페이지",
    "이 화면",
    "여기",
    "현재 페이지",
    "무슨 페이지",
    "what is this page",
    "this page"
  ],
  person: [
    "이 사람",
    "누구",
    "누군데",
    "프로필",
    "소개",
    "약력",
    "경력",
    "커리어",
    "minseok",
    "song",
    "민석",
    "송민석"
  ],
  confusion: [
    "이해 안",
    "이해가 안",
    "모르겠",
    "헷갈",
    "어려",
    "왜",
    "뭐야",
    "설명",
    "confusing",
    "don't understand",
    "hard to understand"
  ],
  smalltalk: [
    "안녕",
    "하이",
    "hello",
    "hi",
    "배고",
    "밥",
    "피곤",
    "졸려",
    "심심",
    "ㅋㅋ",
    "ㅎㅎ",
    "개소리",
    "아무말",
    "hungry",
    "tired",
    "bored"
  ],
  contact: ["연락", "메일", "문의", "미팅", "협업", "contact", "email", "linkedin", "github"]
};

function includesAny(query: string, terms: string[]) {
  const normalized = normalizeNavigatorText(query);
  return terms.some((term) => normalized.includes(normalizeNavigatorText(term)));
}

function prefersKorean(value: string) {
  return /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/.test(value);
}

function detectIntent(query: string): IntentKey | null {
  for (const key of Object.keys(intentTerms) as IntentKey[]) {
    if (includesAny(query, intentTerms[key])) return key;
  }

  return null;
}

function getCardContextBoost(query: string, card: A1ChanKnowledgeCard, context: A1ChanContext) {
  let score = 0;
  if (card.routeId === context.currentRouteId && includesAny(query, intentTerms.currentPage)) score += 22;
  if (card.routeId === context.lastRouteId && includesAny(query, intentTerms.confusion)) score += 8;
  if (card.kind === "person" && includesAny(query, intentTerms.person)) score += 30;
  if (card.kind === "contact" && includesAny(query, intentTerms.contact)) score += 18;
  if (card.kind === "project" && includesAny(query, ["프로젝트", "project", "작업", "연구"])) score += 10;
  return score + card.priority / 100;
}

export function retrieveA1ChanContext(
  query: string,
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext,
  limit = 5
) {
  const miniSearch = new MiniSearch({
    fields: ["title", "summary", "text", "tags", "terms"],
    storeFields: ["id"],
    tokenize: (text) => {
      const tokens: string[] = [];
      const normalized = text.toLowerCase();
      const words = normalized.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 0);
      
      for (const word of words) {
        tokens.push(word);
        if (word.length >= 2) {
          for (let i = 0; i < word.length - 1; i++) {
            tokens.push(word.slice(i, i + 2));
          }
        }
      }
      return tokens;
    },
    searchOptions: {
      boost: { title: 3, terms: 2, tags: 1.5, summary: 1.2 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: "OR"
    }
  });

  miniSearch.addAll(knowledgeCards.map(c => ({
    ...c,
    tags: c.tags.join(" "),
    terms: c.terms.join(" ")
  })));

  const results = miniSearch.search(query);

  const scoredCards = knowledgeCards.map(card => {
    const searchMatch = results.find(r => r.id === card.id);
    let score = searchMatch ? searchMatch.score : 0;
    
    // For single-term queries that hit exactly, give a baseline boost to compete with fallback 0
    if (score === 0) {
      const terms = [card.title, card.summary, ...card.tags, ...card.terms].map(normalizeNavigatorText);
      const normalizedQuery = normalizeNavigatorText(query);
      if (terms.some(t => t === normalizedQuery)) score += 10;
      else if (terms.some(t => t.includes(normalizedQuery))) score += 4;
    }
    
    score += getCardContextBoost(query, card, context);
    return { card, score };
  });

  return scoredCards
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 2)
    .slice(0, limit)
    .map((item) => item.card);
}

function getRoute(routes: NavigatorRoute[], routeId?: string | null) {
  return routes.find((route) => route.id === routeId) ?? routes[0];
}

function actionFromRoute(route?: NavigatorRoute, label?: string, deepLink?: string): A1ChanAction[] {
  if (!route) return [];
  return [
    {
      label: label ?? `${route.label} 열기`,
      href: `${route.path}${deepLink ?? ""}`,
      routeId: route.id
    }
  ];
}

function confidenceFromCards(cards: A1ChanKnowledgeCard[]): NavigatorConfidence {
  if (cards.length >= 2) return "high";
  if (cards.length === 1) return "medium";
  return "low";
}

function currentPageCard(cards: A1ChanKnowledgeCard[], routeId?: string | null) {
  return cards.find((card) => card.kind === "page" && card.routeId === routeId);
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function compact(value: string, maxLength = 360) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function evidenceFromCard(card: A1ChanKnowledgeCard, sentenceCount = 2) {
  const sentences = splitSentences(card.text);
  const detail = sentences
    .filter((sentence) => !sentence.includes(card.summary))
    .slice(0, sentenceCount)
    .join(" ");

  return compact(detail || card.text, 320);
}

function shortTagList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .filter((value) => value.length <= 28)
    .slice(0, 4)
    .join(", ");
}

function deepLinkHint(route: NavigatorRoute) {
  const labels = route.deepLinks.map((link) => link.label).slice(0, 3);
  return labels.length ? `화면 안에서는 ${labels.join(", ")} 순서로 나눠 보면 됩니다.` : "";
}

function koreanCardAnswer(card: A1ChanKnowledgeCard, route: NavigatorRoute) {
  const tags = shortTagList(card.tags);

  switch (card.kind) {
    case "site":
      return `사이트 전체 맥락입니다. ${route.response} 프로필, A1 Firms, 프로젝트, 글, 연락 경로를 한곳에서 연결해 보는 용도입니다.`;
    case "person":
      return `${card.title}의 공개 프로필 맥락입니다. 창업, 연구, AI 전략 시스템, 프로젝트 이력을 함께 확인하는 섹션입니다. 자세한 약력은 About에서 보는 편이 좋습니다.`;
    case "page":
      return `${route.label} 화면입니다. ${route.response} ${deepLinkHint(route)}`.trim();
    case "project":
      return `관련 프로젝트는 "${card.title}"입니다. ${route.response}${tags ? ` 태그는 ${tags}입니다.` : ""}`;
    case "writing":
      return `관련 글은 "${card.title}"입니다. ${route.response}${tags ? ` 태그는 ${tags}입니다.` : ""}`;
    case "contact":
      return `연락 경로입니다. ${route.response}${tags ? ` 공개 채널은 ${tags}입니다.` : ""}`;
    default:
      return `${route.label}와 연결된 항목입니다. ${route.response}`;
  }
}

function answerFromCard(
  card: A1ChanKnowledgeCard,
  routes: NavigatorRoute[],
  query: string,
  prefix?: string
) {
  const route = getRoute(routes, card.routeId);
  if (prefersKorean(query)) {
    const lead = prefix ? `${prefix} ` : "";
    return compact(`${lead}${koreanCardAnswer(card, route)}`, 560);
  }

  const detail = evidenceFromCard(card);
  const lead = prefix ? `${prefix} ` : "";
  return compact(`${lead}${card.title}에 가까운 질문으로 보입니다. ${card.summary}${detail ? ` ${detail}` : ""}`, 560);
}

function relatedActions(cards: A1ChanKnowledgeCard[], routes: NavigatorRoute[]) {
  const seen = new Set<string>();
  const actions: A1ChanAction[] = [];

  for (const card of cards) {
    if (seen.has(card.routeId)) continue;
    seen.add(card.routeId);
    const route = getRoute(routes, card.routeId);
    actions.push({
      label: `${route.label} 보기`,
      href: card.href || route.path,
      routeId: route.id
    });
  }

  return actions.slice(0, 3);
}

function clarifyActions(routes: NavigatorRoute[]) {
  return ["about", "a1-firms", "projects"].map((routeId) => {
    const route = getRoute(routes, routeId);
    return {
      label: route.label,
      href: route.path,
      routeId: route.id
    };
  });
}

function siteScopeMessage() {
  return "저는 이 사이트의 공개 콘텐츠를 기준으로 답합니다. 인물 소개, 현재 페이지, A1 Firms, 프로젝트, 글, 연락 경로처럼 사이트 안에 있는 주제일수록 더 정확하게 안내할 수 있어요.";
}

export function createStaticA1ChanResponse(
  query: string,
  routes: NavigatorRoute[],
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext = {}
): A1ChanResult {
  const source = context.source ?? "static";
  const intent = detectIntent(query);
  const retrieved = retrieveA1ChanContext(query, knowledgeCards, context, 5);

  if (!query.trim()) {
    return {
      mode: "clarify",
      answer: `A1 Chan입니다. ${siteScopeMessage()} 무엇이 궁금한가요?`,
      confidence: "low",
      actions: clarifyActions(routes),
      contextCards: [],
      source
    };
  }

  if (intent === "smalltalk" && !retrieved.length) {
    return {
      mode: "smalltalk",
      answer: `안녕하세요. 가벼운 말도 괜찮지만, ${siteScopeMessage()}`,
      confidence: "medium",
      actions: clarifyActions(routes),
      contextCards: [],
      source
    };
  }

  if (intent === "currentPage") {
    const card = currentPageCard(knowledgeCards, context.currentRouteId) ?? retrieved[0];
    const route = getRoute(routes, card?.routeId ?? context.currentRouteId);

    return {
      mode: "answer",
      answer: card
        ? prefersKorean(query)
          ? compact(`현재 화면은 ${route.label}입니다. ${route.response} ${deepLinkHint(route)}`, 520)
          : compact(`현재 화면은 ${route.label}입니다. ${card.summary} ${evidenceFromCard(card, 1)}`, 520)
        : `현재 화면은 ${route.label}입니다. 이 화면에 연결된 공개 콘텐츠가 충분하지 않아 세부 설명은 제한적입니다.`,
      routeId: route.id,
      routeHref: route.path,
      confidence: card ? "high" : "medium",
      actions: actionFromRoute(route, `${route.label} 계속 보기`),
      contextCards: card ? [card] : retrieved,
      source
    };
  }

  if (intent === "person") {
    const personCard = knowledgeCards.find((item) => item.kind === "person");
    const cards = personCard ? [personCard, ...retrieved.filter((card) => card.id !== personCard.id)] : retrieved;
    const route = getRoute(routes, "about");

    return {
      mode: "answer",
      answer: personCard
        ? answerFromCard(personCard, routes, query, "사이트의 공개 프로필 기준으로는")
        : `인물 관련 질문으로 보입니다. 다만 지금 사용할 수 있는 프로필 카드가 부족합니다. ${siteScopeMessage()}`,
      routeId: route.id,
      routeHref: `${route.path}#profile-overview`,
      deepLink: "#profile-overview",
      confidence: personCard ? "high" : "low",
      actions: actionFromRoute(route, "About 보기", "#profile-overview").concat(
        actionFromRoute(getRoute(routes, "projects"), "Projects 보기")
      ),
      contextCards: cards.slice(0, 5),
      source
    };
  }

  if (intent === "confusion") {
    const card = retrieved[0] ?? currentPageCard(knowledgeCards, context.currentRouteId);
    const route = getRoute(routes, card?.routeId ?? context.currentRouteId);
    const deepLink = route ? selectDeepLink(query, route)?.hash : undefined;

    return {
      mode: "answer",
      answer: card
        ? compact(`헷갈릴 수 있는 지점부터 작게 나누면 좋겠습니다. ${answerFromCard(card, routes, query)} 먼저 제목, 요약, 관련 액션을 분리해서 보면 구조가 덜 복잡해집니다.`, 640)
        : `어떤 부분이 헷갈리는지 아직 특정하기 어렵습니다. ${siteScopeMessage()}`,
      routeId: route.id,
      routeHref: `${route.path}${deepLink ?? ""}`,
      deepLink,
      confidence: card ? "medium" : "low",
      actions: card ? relatedActions([card, ...retrieved], routes) : clarifyActions(routes),
      contextCards: card ? [card, ...retrieved.filter((item) => item.id !== card.id).slice(0, 2)] : retrieved,
      source
    };
  }

  if (retrieved.length) {
    const primary = retrieved[0];
    const route = getRoute(routes, primary.routeId);
    const deepLink = selectDeepLink(query, route)?.hash;

    return {
      mode: primary.routeId === "contacts" ? "navigate" : "answer",
      answer: answerFromCard(primary, routes, query),
      routeId: route.id,
      routeHref: `${route.path}${deepLink ?? ""}`,
      deepLink,
      confidence: confidenceFromCards(retrieved),
      actions: relatedActions(retrieved, routes),
      contextCards: retrieved,
      source
    };
  }

  return {
    mode: "clarify",
    answer: `아직 사이트 안의 어떤 주제와 연결해야 할지 애매합니다. ${siteScopeMessage()}`,
    confidence: "low",
    actions: clarifyActions(routes),
    contextCards: [],
    source
  };
}


