import MiniSearch from "minisearch";
import {
  getNavigatorRoute,
  normalizeNavigatorText,
  selectDeepLink,
  type NavigatorConfidence,
  type NavigatorResultSource,
  type NavigatorRoute
} from "./route-engine";
import type { A1ChanKnowledgeCard } from "./site-knowledge";
import type {
  A1ChanAction,
  A1ChanContextPack,
  A1ChanResult
} from "./shared";

export type {
  A1ChanAction,
  A1ChanContextPack,
  A1ChanResult
};

type A1ChanContext = {
  currentRouteId?: string | null;
  lastRouteId?: string | null;
  lastRecordId?: string | null;
  userHistory?: string[];
  source?: NavigatorResultSource;
};

type A1ChanIntent =
  | "empty"
  | "currentPage"
  | "person"
  | "contact"
  | "projectCollection"
  | "smalltalk"
  | "confusion"
  | "detail"
  | "siteQuestion"
  | "knowledgeQuestion";

const intentTerms: Record<Exclude<A1ChanIntent, "empty" | "knowledgeQuestion">, string[]> = {
  currentPage: [
    "이 페이지",
    "현재 페이지",
    "이 화면",
    "여기",
    "무슨 페이지",
    "중요한 것",
    "핵심",
    "what is this page",
    "this page"
  ],
  person: [
    "이 사람",
    "누구",
    "민석",
    "송민석",
    "minseok",
    "song",
    "프로필",
    "경력",
    "career",
    "resume"
  ],
  contact: ["연락", "메일", "이메일", "협업", "문의", "미팅", "contact", "email", "linkedin", "github"],
  projectCollection: [
    "프로젝트들",
    "프로젝트 전체",
    "프로젝트 목록",
    "분류",
    "정리",
    "projects",
    "project list",
    "portfolio"
  ],
  smalltalk: [
    "안녕",
    "하이",
    "hello",
    "hi",
    "배고프",
    "졸려",
    "심심",
    "개소리",
    "hungry",
    "tired",
    "bored"
  ],
  confusion: [
    "이해 안",
    "이해가 안",
    "모르겠",
    "헷갈",
    "어려워",
    "뭐야",
    "설명",
    "confusing",
    "don't understand",
    "hard to understand"
  ],
  detail: [
    "자세히",
    "상세",
    "더 알려",
    "더 설명",
    "더 파고",
    "깊게",
    "디테일",
    "기술적으로",
    "구체적으로",
    "문제의식",
    "접근",
    "근거",
    "성과",
    "detail",
    "deeper",
    "more",
    "technical"
  ],
  siteQuestion: [
    "사이트",
    "여기는",
    "무엇을 하는",
    "무슨 사이트",
    "site",
    "website",
    "overview"
  ]
};

function includesAny(query: string, terms: string[]) {
  const normalized = normalizeNavigatorText(query);
  return terms.some((term) => normalized.includes(normalizeNavigatorText(term)));
}

function detectIntent(query: string): A1ChanIntent {
  if (!query.trim()) return "empty";
  if (includesAny(query, intentTerms.detail)) return "detail";
  if (includesAny(query, intentTerms.currentPage)) return "currentPage";
  if (includesAny(query, intentTerms.person)) return "person";
  if (includesAny(query, intentTerms.contact)) return "contact";
  if (includesAny(query, intentTerms.projectCollection)) return "projectCollection";
  if (includesAny(query, intentTerms.smalltalk)) return "smalltalk";
  if (includesAny(query, intentTerms.confusion)) return "confusion";
  if (includesAny(query, intentTerms.siteQuestion)) return "siteQuestion";
  return "knowledgeQuestion";
}

function compact(value: string, maxLength = 720) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function stripFinalPeriod(value: string) {
  return value.replace(/[.。?？!！]+$/u, "").trim();
}

function allSearchTerms(card: A1ChanKnowledgeCard) {
  return [card.id, card.title, ...card.aliases, ...card.keywords, ...card.tags, ...card.terms]
    .map(normalizeNavigatorText)
    .filter(Boolean);
}

function exactEntityScore(query: string, card: A1ChanKnowledgeCard) {
  const normalized = normalizeNavigatorText(query);
  if (!normalized) return 0;

  let score = 0;
  for (const term of allSearchTerms(card)) {
    if (!term) continue;
    if (normalized === term) {
      score = Math.max(score, 180);
    } else if (term.length >= 3 && normalized.includes(term)) {
      score = Math.max(score, card.kind === "project" ? 140 : 92);
    } else if (normalized.length >= 3 && term.includes(normalized)) {
      score = Math.max(score, card.kind === "project" ? 84 : 54);
    }
  }

  return score;
}

function contextBoost(query: string, card: A1ChanKnowledgeCard, context: A1ChanContext, intent: A1ChanIntent) {
  let score = card.priority / 10;

  if (card.routeId === context.currentRouteId) score += 10;
  if (card.routeId === context.lastRouteId) score += 4;
  if (intent === "currentPage" && card.routeId === context.currentRouteId) score += 34;
  if (intent === "person" && card.kind === "person") score += 70;
  if (intent === "contact" && card.kind === "contact") score += 70;
  if (intent === "siteQuestion" && card.kind === "site") score += 54;
  if (intent === "projectCollection" && card.id === "projects-collection") score += 80;
  if (intent === "detail" && context.lastRecordId && card.id === context.lastRecordId) score += 140;
  if (intent === "confusion" && card.routeId === context.currentRouteId) score += 18;
  if (card.kind === "project" && includesAny(query, ["프로젝트", "project", "연구", "제품", "특허"])) score += 15;

  return score;
}

function createSearchIndex(knowledgeCards: A1ChanKnowledgeCard[]) {
  const miniSearch = new MiniSearch({
    fields: ["title", "aliases", "summary", "facts", "keywords", "tags", "terms", "text"],
    storeFields: ["id"],
    tokenize: (text) => {
      const tokens: string[] = [];
      const words = normalizeNavigatorText(text)
        .split(/\s+/)
        .filter(Boolean);

      for (const word of words) {
        tokens.push(word);
        if (word.length >= 3) {
          for (let i = 0; i < word.length - 1; i += 1) {
            tokens.push(word.slice(i, i + 2));
          }
        }
      }

      return tokens;
    },
    searchOptions: {
      boost: {
        title: 5,
        aliases: 5,
        keywords: 3,
        facts: 2,
        summary: 2,
        tags: 1.5,
        text: 1
      },
      prefix: true,
      fuzzy: 0.18,
      combineWith: "OR"
    }
  });

  miniSearch.addAll(
    knowledgeCards.map((card) => ({
      id: card.id,
      title: card.title,
      aliases: card.aliases.join(" "),
      summary: card.summary,
      facts: card.facts.join(" "),
      keywords: card.keywords.join(" "),
      tags: card.tags.join(" "),
      terms: card.terms.join(" "),
      text: card.text
    }))
  );

  return miniSearch;
}

export function retrieveA1ChanContext(
  query: string,
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext,
  limit = 6
) {
  const intent = detectIntent(query);
  const miniSearch = createSearchIndex(knowledgeCards);
  const results = query.trim() ? miniSearch.search(query) : [];

  const scoredCards = knowledgeCards.map((card) => {
    const searchMatch = results.find((result) => result.id === card.id);
    const score =
      (searchMatch?.score ?? 0) +
      exactEntityScore(query, card) +
      contextBoost(query, card, context, intent);
    return { card, score };
  });

  return scoredCards
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 8)
    .slice(0, limit)
    .map((item) => item.card);
}

function getRoute(routes: NavigatorRoute[], routeId?: string | null) {
  return getNavigatorRoute(routes, routeId);
}

function confidenceFromCards(cards: A1ChanKnowledgeCard[], intent: A1ChanIntent): NavigatorConfidence {
  if (intent === "empty") return "low";
  if (cards[0]?.kind === "project" || cards[0]?.kind === "person" || cards[0]?.kind === "contact") return "high";
  if (cards.length >= 2) return "high";
  if (cards.length === 1) return "medium";
  return "low";
}

function actionLabel(card: A1ChanKnowledgeCard) {
  if (card.id === "projects-collection") return "Projects 전체 보기";
  if (card.kind === "project") return `${card.title.replace(/\s+(Strategy|Vision|Control|System|Architecture|Engine|Platform|Analysis|AI)$/i, "")} 보기`;
  if (card.kind === "contact") return "Contacts 보기";
  if (card.kind === "person") return "About 보기";
  return `${card.title} 보기`;
}

function relatedActions(cards: A1ChanKnowledgeCard[], routes: NavigatorRoute[]) {
  const actions: A1ChanAction[] = [];
  const seen = new Set<string>();
  const primary = cards[0];

  if (primary?.kind === "project") {
    const projectsRoute = getRoute(routes, "projects");
    return [
      {
        label: actionLabel(primary),
        href: primary.href,
        routeId: "projects"
      },
      {
        label: "Projects 전체 보기",
        href: `${projectsRoute.path}#project-overview`,
        routeId: projectsRoute.id
      }
    ];
  }

  if (primary?.kind === "person") {
    const aboutRoute = getRoute(routes, "about");
    const projectsRoute = getRoute(routes, "projects");
    return [
      { label: "About 보기", href: `${aboutRoute.path}#profile-overview`, routeId: aboutRoute.id },
      { label: "Projects 보기", href: projectsRoute.path, routeId: projectsRoute.id }
    ];
  }

  if (primary?.kind === "contact") {
    const contactsRoute = getRoute(routes, "contacts");
    return [{ label: "Contacts 보기", href: primary.href || `${contactsRoute.path}#contact-graph`, routeId: contactsRoute.id }];
  }

  for (const card of cards) {
    const key = `${card.routeId}:${card.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const route = getRoute(routes, card.routeId);
    actions.push({
      label: actionLabel(card),
      href: card.href || route.path,
      routeId: route.id
    });
  }

  return actions.slice(0, 4);
}

function clarifyActions(routes: NavigatorRoute[]) {
  return ["about", "a1-firms", "projects", "contacts"].map((routeId) => {
    const route = getRoute(routes, routeId);
    return {
      label: route.label,
      href: route.path,
      routeId: route.id
    };
  });
}

function currentPageRecord(cards: A1ChanKnowledgeCard[], routeId?: string | null) {
  if (routeId === "projects") {
    return cards.find((card) => card.id === "projects-collection");
  }

  if (routeId === "a1-firms") {
    return cards.find((card) => card.id === "a1-firms-product-context");
  }

  return cards.find((card) => card.kind === "page" && card.routeId === routeId);
}

function siteScopeMessage() {
  return "저는 이 사이트의 공개 콘텐츠를 근거로 답합니다. 인물/경력, A1 Firms, 15개 프로젝트, 글, 연락 경로를 물어보면 가장 잘 답할 수 있어요.";
}

function sentenceFromFacts(card: A1ChanKnowledgeCard, start = 0, count = 2) {
  return card.facts.slice(start, start + count).join(" ");
}

function answerForProject(card: A1ChanKnowledgeCard, detail = false) {
  const oneLiner = card.facts[0] || card.summary;
  const problem = card.facts[1];
  const approach = card.facts[2];
  const core = card.facts[3];
  const evidence = card.facts[4];
  const impact = card.facts[5] || card.facts[6];

  if (!detail) {
    return compact(
      [
        oneLiner.includes(card.title) ? oneLiner : `${card.title}: ${oneLiner}`,
        core ? `기술적으로는 ${stripFinalPeriod(compact(core, 130))}.` : "",
        "더 파고들면 문제의식, 접근 방식, 근거까지 이어서 설명할 수 있어요."
      ]
        .filter(Boolean)
        .join(" "),
      360
    );
  }

  return compact(
    [
      oneLiner.includes(card.title) ? oneLiner : `${card.title}: ${oneLiner}`,
      problem || approach ? `문제/접근: ${compact([problem, approach].filter(Boolean).join(" "), 190)}` : "",
      core || evidence ? `핵심/근거: ${compact([core, evidence].filter(Boolean).join(" "), 170)}` : ""
    ]
      .filter(Boolean)
      .join(" "),
    520
  );
}

function answerForProjectsCollection(cards: A1ChanKnowledgeCard[]) {
  const projectCards = cards
    .filter((card) => card.kind === "project")
    .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
  const a1 = projectCards.filter((card) => card.tags.includes("A1 Firms")).map((card) => card.title);
  const research = projectCards
    .filter((card) => !card.tags.includes("A1 Firms") && card.tags.some((tag) => /Research|Semiconductor|Physics|Machine Learning|KRISS|Medical|Materials/i.test(tag)))
    .map((card) => card.title);
  const business = projectCards
    .filter((card) => !a1.includes(card.title) && !research.includes(card.title))
    .map((card) => card.title);

  return compact(
    `Projects에는 현재 ${projectCards.length}개 공개 프로젝트가 있습니다. A1 Firms 계열은 ${a1.join(", ")}이고, 연구/공학 계열은 ${research.join(", ")}입니다. 사업화/제품/UX 성격으로는 ${business.join(", ")} 등이 있습니다. 특정 프로젝트 이름을 물어보면 문제의식, 접근, 기술 핵심, 성과를 따로 설명할 수 있습니다.`,
    780
  );
}

function answerForPerson(card: A1ChanKnowledgeCard) {
  return compact(
    `${card.title}은 A1trategize Founder이자 KAIST NNFC R&D Intern입니다. ${sentenceFromFacts(card, 0, 3)} 프로젝트 맥락으로는 A1trategize, RA1, 마이크로 배터리, 초음파/센서 연구, 특허 사업화 경험이 함께 연결됩니다.`,
    720
  );
}

function answerForContact(card: A1ChanKnowledgeCard) {
  return compact(`연락은 공개 채널 기준으로 가능합니다. ${card.facts.join(", ")}. 협업, 자문, 제품 대화는 Contacts 화면에서 이어가면 됩니다.`, 520);
}

function answerForGenericCard(card: A1ChanKnowledgeCard, route: NavigatorRoute, intent: A1ChanIntent) {
  if (card.kind === "project") return answerForProject(card, intent === "detail");
  if (card.kind === "person") return answerForPerson(card);
  if (card.kind === "contact") return answerForContact(card);

  const detail = card.facts.length ? sentenceFromFacts(card, 0, 3) : card.summary;
  return compact(`${card.title}에 대한 설명입니다. ${card.summary} ${detail} 관련 화면은 ${route.label}입니다.`, 680);
}

function buildContextPack(
  query: string,
  intent: A1ChanIntent,
  cards: A1ChanKnowledgeCard[],
  actions: A1ChanAction[],
  confidence: NavigatorConfidence,
  context: A1ChanContext
): A1ChanContextPack {
  const primaryRecord = cards[0];
  return {
    query,
    locale: "ko",
    currentRouteId: context.currentRouteId,
    intent,
    primaryRecord,
    matchedRecords: cards,
    evidence: cards.flatMap((card) => card.facts.slice(0, 3)).slice(0, 8),
    suggestedActions: actions,
    confidence
  };
}

function resultFromCard(
  query: string,
  intent: A1ChanIntent,
  card: A1ChanKnowledgeCard,
  matchedCards: A1ChanKnowledgeCard[],
  routes: NavigatorRoute[],
  context: A1ChanContext
): A1ChanResult {
  const source = context.source ?? "static";
  const route = getRoute(routes, card.routeId);
  const deepLink = selectDeepLink(query, route)?.hash;
  const routeHref = card.href || `${route.path}${deepLink ?? ""}`;
  const confidence = confidenceFromCards(matchedCards, intent);
  const actions = relatedActions([card, ...matchedCards.filter((item) => item.id !== card.id)], routes);
  const answer = card.id === "projects-collection"
    ? answerForProjectsCollection(matchedCards)
    : answerForGenericCard(card, route, intent);

  return {
    mode: card.kind === "contact" ? "navigate" : "answer",
    answer,
    routeId: route.id,
    routeHref,
    deepLink,
    confidence,
    actions,
    contextCards: matchedCards,
    contextPack: buildContextPack(query, intent, matchedCards, actions, confidence, context),
    source
  };
}

export function createStaticA1ChanResponse(
  query: string,
  routes: NavigatorRoute[],
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext = {}
): A1ChanResult {
  const source = context.source ?? "static";
  const trimmed = query.trim();
  const intent = detectIntent(trimmed);

  if (intent === "empty") {
    const actions = clarifyActions(routes);
    return {
      mode: "clarify",
      answer: `A1 Chan입니다. ${siteScopeMessage()} 예: "RA1 설명해줘", "이 사람은 누구야?", "A1trategize가 뭐야?"처럼 물어보면 됩니다.`,
      confidence: "low",
      actions,
      contextCards: [],
      contextPack: buildContextPack(trimmed, intent, [], actions, "low", context),
      source
    };
  }

  let retrieved = retrieveA1ChanContext(trimmed, knowledgeCards, context, 8);

  if (intent === "detail" && context.lastRecordId) {
    const lastRecord = knowledgeCards.find((card) => card.id === context.lastRecordId);
    if (lastRecord) {
      retrieved = [lastRecord, ...retrieved.filter((card) => card.id !== lastRecord.id)];
    }
  }

  if (intent === "currentPage") {
    const current = currentPageRecord(knowledgeCards, context.currentRouteId);
    if (current) {
      retrieved = [current, ...retrieved.filter((card) => card.id !== current.id)];
    }
  }

  if (intent === "projectCollection") {
    const collection = knowledgeCards.find((card) => card.id === "projects-collection");
    const projects = knowledgeCards.filter((card) => card.kind === "project");
    retrieved = collection ? [collection, ...projects] : projects;
  }

  if (intent === "smalltalk" && !retrieved.some((card) => card.kind !== "site")) {
    const actions = clarifyActions(routes);
    return {
      mode: "smalltalk",
      answer: `그 말도 받긴 합니다. 다만 저는 사이트 DB를 보는 챗봇이라 배고픔은 해결 못 하고, 대신 ${siteScopeMessage()}`,
      confidence: "medium",
      actions,
      contextCards: [],
      contextPack: buildContextPack(trimmed, intent, [], actions, "medium", context),
      source
    };
  }

  const primary = retrieved[0];
  if (primary) {
    return resultFromCard(trimmed, intent, primary, retrieved, routes, context);
  }

  const fallbackRoute = getRoute(routes, context.currentRouteId ?? "projects");
  const actions = clarifyActions(routes);
  return {
    mode: "clarify",
    answer: `아직 사이트 DB에서 정확히 맞는 항목을 찾지 못했습니다. ${siteScopeMessage()} 프로젝트 이름, 기술 키워드, 연락/경력 같은 식으로 조금만 좁혀서 물어보면 더 정확합니다.`,
    routeId: fallbackRoute.id,
    routeHref: fallbackRoute.path,
    confidence: "low",
    actions,
    contextCards: [],
    contextPack: buildContextPack(trimmed, intent, [], actions, "low", context),
    source
  };
}
