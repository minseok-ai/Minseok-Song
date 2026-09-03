import MiniSearch from "minisearch";
import { normalizeNavigatorText } from "../route-engine";
import type { A1ChanKnowledgeCard } from "../site-knowledge";
import { includesAny } from "./intent";
import type { A1ChanContext, A1ChanIntent } from "./types";

export type A1ChanRetrievalMatch = {
  card: A1ChanKnowledgeCard;
  score: number;
  reasons: string[];
};

type SearchIndexBundle = {
  miniSearch: MiniSearch;
  cardById: Map<string, A1ChanKnowledgeCard>;
};

const searchIndexCache = new WeakMap<A1ChanKnowledgeCard[], SearchIndexBundle>();

function normalizedTerms(values: string[]) {
  return values
    .map(normalizeNavigatorText)
    .filter(Boolean);
}

function exactEntityScore(query: string, card: A1ChanKnowledgeCard, reasons: string[]) {
  const normalized = normalizeNavigatorText(query);
  if (!normalized) return 0;

  let score = 0;
  const entityTerms = normalizedTerms([card.id, card.title, ...card.aliases]);
  const broadTerms = normalizedTerms([...card.keywords, ...card.tags, ...card.terms]);

  for (const term of entityTerms) {
    if (!term) continue;
    if (normalized === term) {
      score = Math.max(score, card.kind === "project" ? 520 : 420);
      reasons.push("exact-entity");
    } else if (term.length >= 3 && normalized.includes(term)) {
      score = Math.max(score, card.kind === "project" ? 380 : 260);
      reasons.push("entity-in-query");
    } else if (normalized.length >= 3 && term.includes(normalized)) {
      score = Math.max(score, card.kind === "project" ? 170 : 120);
      reasons.push("query-in-entity");
    }
  }

  for (const term of broadTerms) {
    if (!term || term.length < 3) continue;
    if (normalized === term) {
      score = Math.max(score, 42);
      reasons.push("exact-keyword");
    } else if (normalized.includes(term) || term.includes(normalized)) {
      score = Math.max(score, 28);
      reasons.push("keyword");
    }
  }

  return score;
}

function countMatchedTerms(query: string, values: string[]) {
  const normalized = normalizeNavigatorText(query);
  if (!normalized) return 0;

  return normalizedTerms(values).filter((term) => term.length >= 3 && normalized.includes(term)).length;
}

function dateRecencyBoost(query: string, card: A1ChanKnowledgeCard, reasons: string[]) {
  const normalized = normalizeNavigatorText(query);
  const asksRecent = /(latest|recent|current|present|now|최신|최근|현재|진행)/i.test(normalized);
  const yearMatch = card.terms.find((term) => /^(20\d{2}|20\d{2}[-~]20\d{2})$/.test(term));
  let score = 0;

  if (asksRecent && yearMatch) {
    const year = Number(yearMatch.slice(0, 4));
    if (Number.isFinite(year)) {
      score += Math.max(0, year - 2022) * 4;
      reasons.push("recency");
    }
  }

  if (yearMatch && normalized.includes(yearMatch)) {
    score += 32;
    reasons.push("year");
  }

  return score;
}

function semanticBoost(query: string, card: A1ChanKnowledgeCard, reasons: string[]) {
  let score = 0;
  const organizationMatches = countMatchedTerms(query, [
    "KAIST",
    "NNFC",
    "National Nanofab Center",
    "KRISS",
    "Chungnam National University",
    "CNU",
    "KIPO",
    "Oam",
    "Innopolis",
    "KOSAF",
    ...card.tags
  ]);
  const technicalMatches = countMatchedTerms(query, [
    ...card.keywords,
    ...card.terms,
    "photolithography",
    "sputter",
    "ultrasound",
    "robust regression",
    "LSTM",
    "CNN",
    "Random Forest",
    "MyData",
    "OBD",
    "BLE",
    "patent",
    "특허",
    "초음파",
    "반도체",
    "배터리"
  ]);
  const proofMatches = countMatchedTerms(query, [
    ...(card.proofPoints ?? []),
    "award",
    "수상",
    "patent",
    "특허",
    "publication",
    "논문",
    "first author",
    "1st author",
    "MSE",
    "KSNT",
    "AAiCON",
    "Grand Prize",
    "Special Award"
  ]);

  if (organizationMatches) {
    score += organizationMatches * 18;
    reasons.push("organization");
  }
  if (technicalMatches) {
    score += Math.min(technicalMatches, 6) * 12;
    reasons.push("technical-keyword");
  }
  if (proofMatches) {
    score += Math.min(proofMatches, 4) * 16;
    reasons.push("proof-point");
  }

  return score;
}

function contextBoost(query: string, card: A1ChanKnowledgeCard, context: A1ChanContext, intent: A1ChanIntent, reasons: string[]) {
  let score = card.priority / 10;

  if (card.routeId === context.currentRouteId) {
    score += 10;
    reasons.push("current-page");
  }
  if (card.routeId === context.lastRouteId) {
    score += 4;
    reasons.push("last-route");
  }
  if (intent === "currentPage" && card.routeId === context.currentRouteId) {
    score += 54;
    reasons.push("current-page-intent");
  }
  if (intent === "person" && card.kind === "person") {
    score += 90;
    reasons.push("person-intent");
  }
  if (intent === "contact" && card.kind === "contact") {
    score += 90;
    reasons.push("contact-intent");
  }
  if (intent === "siteQuestion" && card.kind === "site") {
    score += 62;
    reasons.push("site-intent");
  }
  if ((intent === "projectCollection" || intent === "recommendation") && card.id === "projects-collection") {
    score += 100;
    reasons.push("project-collection");
  }
  if ((intent === "summary" || intent === "detail") && context.lastRecordId && card.id === context.lastRecordId) {
    score += 160;
    reasons.push("last-record");
  }
  if (intent === "confusion" && context.lastRecordId && card.id === context.lastRecordId) {
    score += 160;
    reasons.push("last-record");
  }
  if (intent === "confusion" && card.routeId === context.currentRouteId) {
    score += 34;
    reasons.push("current-page-context");
  }
  if (intent === "open" && card.routeId === context.currentRouteId) {
    score += 8;
    reasons.push("open-context");
  }
  if ((intent === "compare" || intent === "recommendation") && card.kind === "project") {
    score += 38;
    reasons.push(`${intent}-project`);
  }
  if (card.kind === "project" && includesAny(query, ["프로젝트", "project", "연구", "제품", "특허"])) {
    score += 15;
    reasons.push("project-term");
  }

  return score;
}

function createSearchIndex(knowledgeCards: A1ChanKnowledgeCard[]) {
  const miniSearch = new MiniSearch({
    fields: ["title", "aliases", "summary", "shortAnswer", "detailAnswer", "facts", "proofPoints", "keywords", "tags", "terms", "text"],
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
        proofPoints: 2,
        shortAnswer: 2.5,
        detailAnswer: 1.5,
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
      shortAnswer: card.shortAnswer ?? "",
      detailAnswer: card.detailAnswer ?? "",
      facts: card.facts.join(" "),
      proofPoints: card.proofPoints?.join(" ") ?? "",
      keywords: card.keywords.join(" "),
      tags: card.tags.join(" "),
      terms: card.terms.join(" "),
      text: card.text
    }))
  );

  return {
    miniSearch,
    cardById: new Map(knowledgeCards.map((card) => [card.id, card]))
  };
}

function getSearchIndex(knowledgeCards: A1ChanKnowledgeCard[]) {
  const cached = searchIndexCache.get(knowledgeCards);
  if (cached) return cached;

  const created = createSearchIndex(knowledgeCards);
  searchIndexCache.set(knowledgeCards, created);
  return created;
}

export function retrieveA1ChanMatches(
  query: string,
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext,
  intent: A1ChanIntent,
  limit = 6
) {
  const { miniSearch } = getSearchIndex(knowledgeCards);
  const results = query.trim() ? miniSearch.search(query) : [];

  const scoredCards = knowledgeCards.map((card) => {
    const searchMatch = results.find((result) => result.id === card.id);
    const reasons: string[] = [];
    if (searchMatch?.score) reasons.push("full-text");
    const score =
      (searchMatch?.score ?? 0) +
      exactEntityScore(query, card, reasons) +
      semanticBoost(query, card, reasons) +
      dateRecencyBoost(query, card, reasons) +
      contextBoost(query, card, context, intent, reasons);
    return { card, score: Number(score.toFixed(3)), reasons: Array.from(new Set(reasons)) };
  });

  return scoredCards
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 8)
    .slice(0, limit);
}

export function retrievalScoresFromMatches(matches: A1ChanRetrievalMatch[]) {
  return matches.map((match) => ({
    id: match.card.id,
    title: match.card.title,
    kind: match.card.kind,
    score: match.score,
    reasons: match.reasons
  }));
}

export function retrieveA1ChanContext(
  query: string,
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext,
  intent: A1ChanIntent,
  limit = 6
) {
  return retrieveA1ChanMatches(query, knowledgeCards, context, intent, limit)
    .map((item) => item.card);
}
