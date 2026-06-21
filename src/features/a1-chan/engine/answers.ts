import {
  getNavigatorRoute,
  selectDeepLink,
  type NavigatorConfidence,
  type NavigatorRoute
} from "../route-engine";
import type { A1ChanKnowledgeCard } from "../site-knowledge";
import type {
  A1ChanAction,
  A1ChanAnswerPart,
  A1ChanContextPack,
  A1ChanResult,
  A1ChanSourceCard
} from "../shared";
import type { A1ChanContext, A1ChanDetectedLanguage, A1ChanIntent } from "./types";

function compact(value: string, maxLength = 900) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function stripFinalPeriod(value: string) {
  return value.replace(/[.。?？!！]+$/u, "").trim();
}

function sentenceFromFacts(card: A1ChanKnowledgeCard, start = 0, count = 2) {
  return card.facts.slice(start, start + count).join(" ");
}

function getRoute(routes: NavigatorRoute[], routeId?: string | null) {
  return getNavigatorRoute(routes, routeId);
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

export function currentPageRecord(cards: A1ChanKnowledgeCard[], routeId?: string | null) {
  if (!routeId || routeId === "home") {
    return cards.find((card) => card.id === "site-overview");
  }

  if (routeId === "projects") {
    return cards.find((card) => card.id === "projects-collection");
  }

  if (routeId === "a1-firms") {
    return cards.find((card) => card.id === "a1-firms-product-context");
  }

  return cards.find((card) => card.kind === "page" && card.routeId === routeId);
}

export function sourceCardsFromCards(cards: A1ChanKnowledgeCard[]): A1ChanSourceCard[] {
  const seen = new Set<string>();
  return cards
    .filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    })
    .slice(0, 4)
    .map((card) => ({
      id: card.id,
      kind: card.kind,
      title: card.title,
      href: card.href,
      source: card.source
    }));
}

function confidenceFromCards(cards: A1ChanKnowledgeCard[], intent: A1ChanIntent): NavigatorConfidence {
  if (intent === "empty") return "low";
  if (cards[0]?.kind === "project" || cards[0]?.kind === "person" || cards[0]?.kind === "contact") return "high";
  if (intent === "currentPage" && cards.length) return "high";
  if (intent === "writing" && cards.length) return "high";
  if (cards.length >= 2) return "high";
  if (cards.length === 1) return "medium";
  return "low";
}

function actionLabel(card: A1ChanKnowledgeCard) {
  if (card.id === "projects-collection") return "Projects 전체 보기";
  if (card.kind === "project") return `${card.title.replace(/\s+(Strategy|Vision|Control|System|Architecture|Engine|Platform|Analysis|AI)$/i, "")} 보기`;
  if (card.kind === "contact") return "Contacts 보기";
  if (card.kind === "person") return "About 보기";
  if (card.kind === "writing") return "글 읽기";
  return `${card.title} 보기`;
}

function actionForRoute(routes: NavigatorRoute[], routeId: string, label?: string, hash = ""): A1ChanAction {
  const route = getRoute(routes, routeId);
  return {
    label: label ?? `${route.label} 보기`,
    href: `${route.path}${hash}`,
    routeId: route.id
  };
}

export function clarifyActions(routes: NavigatorRoute[]) {
  return [
    actionForRoute(routes, "about"),
    actionForRoute(routes, "a1-firms"),
    actionForRoute(routes, "projects"),
    actionForRoute(routes, "contacts")
  ];
}

function relatedActions(cards: A1ChanKnowledgeCard[], routes: NavigatorRoute[], intent: A1ChanIntent) {
  const actions: A1ChanAction[] = [];
  const seen = new Set<string>();
  const primary = cards[0];

  if (intent === "writing") {
    actions.push(actionForRoute(routes, "writings", "Writings 보기"));
  }

  if (primary?.kind === "project") {
    return [
      {
        label: actionLabel(primary),
        href: primary.href,
        routeId: "projects"
      },
      actionForRoute(routes, "projects", "Projects 전체 보기", "#project-overview")
    ];
  }

  if (primary?.kind === "person") {
    return [
      actionForRoute(routes, "about", "About 보기", "#profile-overview"),
      actionForRoute(routes, "projects", "Projects 보기")
    ];
  }

  if (primary?.kind === "contact") {
    return [{ label: "Contacts 보기", href: primary.href || actionForRoute(routes, "contacts").href, routeId: "contacts" }];
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

function answerPartsForProject(card: A1ChanKnowledgeCard, detail = false): A1ChanAnswerPart[] {
  const oneLiner = card.facts[0] || card.shortAnswer || card.summary;
  const problem = card.facts[1];
  const approach = card.facts[2];
  const core = card.facts[3];
  const evidence = card.facts[4];
  const impact = card.facts[5];
  const status = card.facts[6];
  const headline = compact(oneLiner.includes(card.title) ? oneLiner : `${card.title}: ${oneLiner}`, 300);

  if (!detail) {
    return [
      { text: headline },
      ...(problem || approach
        ? [{ label: "문제/접근", text: compact([problem, approach].filter(Boolean).join(" "), 260) }]
        : []),
      ...(core
        ? [{ label: "기술 핵심", text: `기술적으로는 ${stripFinalPeriod(compact(core, 190))}.` }]
        : []),
      ...(evidence || impact
        ? [{ label: "근거/의미", text: compact([evidence, impact].filter(Boolean).join(" "), 250) }]
        : []),
      ...(status ? [{ label: "상태", text: compact(status, 160) }] : [])
    ];
  }

  return [
    { text: headline },
    ...(problem ? [{ label: "문제의식", text: compact(problem, 240) }] : []),
    ...(approach ? [{ label: "접근", text: compact(approach, 260) }] : []),
    ...(core || evidence ? [{ label: "핵심/근거", text: compact([core, evidence].filter(Boolean).join(" "), 300) }] : []),
    ...(impact || status ? [{ label: "의미/상태", text: compact([impact, status].filter(Boolean).join(" "), 240) }] : [])
  ];
}

function answerPartsForProjectsCollection(cards: A1ChanKnowledgeCard[]): A1ChanAnswerPart[] {
  const projectCards = cards
    .filter((card) => card.kind === "project")
    .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
  const a1 = projectCards.filter((card) => card.tags.includes("A1 Firms")).map((card) => card.title);
  const research = projectCards
    .filter((card) => !card.tags.includes("A1 Firms") && card.tags.some((tag) => /Research|Semiconductor|Physics|Machine Learning|KRISS|Medical|Materials|Energy|Fabrication|Big Data|Agriculture/i.test(tag)))
    .map((card) => card.title);
  const business = projectCards
    .filter((card) => !a1.includes(card.title) && !research.includes(card.title))
    .map((card) => card.title);

  return [
    { text: `Projects에는 현재 ${projectCards.length}개 공개 프로젝트가 있으며, 화면 순서대로 A1 제품군 이후 최신 연구/특허/사업화 프로젝트가 이어집니다.` },
    { label: "A1 Firms", text: a1.join(", ") || "A1trategize, A1ntuitize, RA1 계열 프로젝트를 확인할 수 있습니다." },
    { label: "연구/공학", text: research.join(", ") || "반도체, 에너지, 초음파, 센서, 데이터 분석 프로젝트를 확인할 수 있습니다." },
    { label: "사업화/제품", text: `${business.join(", ")} 등이 있습니다. 특정 프로젝트 이름을 물어보면 문제의식, 접근, 기술 핵심, 성과를 따로 설명할 수 있습니다.` }
  ];
}

function answerPartsForPerson(card: A1ChanKnowledgeCard): A1ChanAnswerPart[] {
  return [
    { text: card.shortAnswer || `${card.title}은 A1trategize Founder이자 KAIST NNFC R&D Intern입니다.` },
    { label: "현재 축", text: sentenceFromFacts(card, 0, 2) },
    { label: "연결 프로젝트", text: "A1trategize, RA1, 마이크로 배터리, 초음파/센서 연구, 특허 사업화 경험이 함께 연결됩니다." }
  ];
}

function answerPartsForContact(card: A1ChanKnowledgeCard): A1ChanAnswerPart[] {
  return [
    { text: card.shortAnswer || "연락은 공개 채널 기준으로 가능합니다." },
    { label: "공개 채널", text: card.facts.join(", ") },
    { label: "권장 맥락", text: "협업, 자문, 제품 대화처럼 목적이 분명한 대화는 Contacts 화면에서 이어가면 됩니다." }
  ];
}

function answerPartsForGenericCard(card: A1ChanKnowledgeCard, route: NavigatorRoute, intent: A1ChanIntent): A1ChanAnswerPart[] {
  if (card.kind === "project") return answerPartsForProject(card, intent === "detail");
  if (card.kind === "person") return answerPartsForPerson(card);
  if (card.kind === "contact") return answerPartsForContact(card);
  if (card.id === "projects-collection") return answerPartsForProjectsCollection([card]);

  const detail = card.detailAnswer || card.shortAnswer || (card.facts.length ? sentenceFromFacts(card, 0, 3) : card.summary);
  return [
    { text: card.shortAnswer || `${card.title}에 대한 설명입니다.` },
    { label: "근거", text: compact(detail, 520) },
    { label: "관련 화면", text: `${route.label}에서 이어서 확인할 수 있습니다.` }
  ];
}

function buildContextPack(
  query: string,
  intent: A1ChanIntent,
  cards: A1ChanKnowledgeCard[],
  actions: A1ChanAction[],
  confidence: NavigatorConfidence,
  context: A1ChanContext,
  detectedLanguage: A1ChanDetectedLanguage,
  suggestedQuestions: string[],
  qualityFlags: string[]
): A1ChanContextPack {
  const primaryRecord = cards[0];
  return {
    query,
    locale: "ko",
    currentRouteId: context.currentRouteId,
    intent,
    primaryRecord,
    matchedRecords: cards,
    evidence: cards.flatMap((card) => [...card.facts.slice(0, 3), ...(card.proofPoints ?? []).slice(0, 2)]).slice(0, 8),
    suggestedActions: actions,
    confidence,
    detectedLanguage,
    suggestedQuestions,
    qualityFlags
  };
}

function answerFromParts(parts: A1ChanAnswerPart[]) {
  return compact(parts.map((part) => [part.label, part.text].filter(Boolean).join(": ")).join(" "), 900);
}

function suggestedQuestionsFor(card: A1ChanKnowledgeCard | undefined, intent: A1ChanIntent) {
  if (intent === "capability") return ["RA1 설명해줘", "이 페이지는 뭐야?", "연락하고 싶어"];
  if (intent === "writing") return ["최근 글은 뭐가 있어?", "이 글 요약해줘", "관련 프로젝트도 있어?"];
  if (intent === "currentPage") return ["핵심만 요약해줘", "관련 프로젝트는?", "다음에 어디를 보면 돼?"];
  return unique([...(card?.nextQuestions ?? []), "더 자세히", "관련 화면으로 안내해줘"]).slice(0, 3);
}

export function resultFromCard(
  query: string,
  intent: A1ChanIntent,
  card: A1ChanKnowledgeCard,
  matchedCards: A1ChanKnowledgeCard[],
  routes: NavigatorRoute[],
  context: A1ChanContext,
  detectedLanguage: A1ChanDetectedLanguage
): A1ChanResult {
  const source = context.source ?? "static";
  const route = getRoute(routes, card.routeId);
  const deepLink = selectDeepLink(query, route)?.hash;
  const routeHref = card.href || `${route.path}${deepLink ?? ""}`;
  const confidence = confidenceFromCards(matchedCards, intent);
  const actions = relatedActions([card, ...matchedCards.filter((item) => item.id !== card.id)], routes, intent);
  const answerParts = card.id === "projects-collection"
    ? answerPartsForProjectsCollection(matchedCards)
    : answerPartsForGenericCard(card, route, intent);
  const suggestedQuestions = suggestedQuestionsFor(card, intent);
  const qualityFlags = confidence === "low" ? ["low-confidence"] : [];

  return {
    mode: intent === "open" || card.kind === "contact" ? "navigate" : "answer",
    answer: answerFromParts(answerParts),
    answerParts,
    routeId: route.id,
    routeHref,
    deepLink,
    confidence,
    actions,
    contextCards: matchedCards,
    sourceCards: sourceCardsFromCards(matchedCards),
    suggestedQuestions,
    qualityFlags,
    detectedLanguage,
    contextPack: buildContextPack(query, intent, matchedCards, actions, confidence, context, detectedLanguage, suggestedQuestions, qualityFlags),
    source
  };
}

export function manualResult({
  query,
  intent,
  mode,
  answerParts,
  routes,
  context,
  detectedLanguage,
  routeId,
  routeHref,
  cards = [],
  actions,
  confidence = "medium",
  qualityFlags = []
}: {
  query: string;
  intent: A1ChanIntent;
  mode: A1ChanResult["mode"];
  answerParts: A1ChanAnswerPart[];
  routes: NavigatorRoute[];
  context: A1ChanContext;
  detectedLanguage: A1ChanDetectedLanguage;
  routeId?: string;
  routeHref?: string;
  cards?: A1ChanKnowledgeCard[];
  actions?: A1ChanAction[];
  confidence?: NavigatorConfidence;
  qualityFlags?: string[];
}): A1ChanResult {
  const resolvedActions = actions ?? clarifyActions(routes);
  const suggestedQuestions = suggestedQuestionsFor(cards[0], intent);
  const route = routeId ? getRoute(routes, routeId) : undefined;

  return {
    mode,
    answer: answerFromParts(answerParts),
    answerParts,
    routeId: route?.id ?? routeId,
    routeHref: routeHref ?? route?.path,
    confidence,
    actions: resolvedActions,
    contextCards: cards,
    sourceCards: sourceCardsFromCards(cards),
    suggestedQuestions,
    qualityFlags,
    detectedLanguage,
    contextPack: buildContextPack(query, intent, cards, resolvedActions, confidence, context, detectedLanguage, suggestedQuestions, qualityFlags),
    source: context.source ?? "static"
  };
}
