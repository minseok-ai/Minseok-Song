import MiniSearch from "minisearch";
import { normalizeNavigatorText } from "../route-engine";
import type { A1ChanKnowledgeCard } from "../site-knowledge";
import { includesAny } from "./intent";
import type { A1ChanContext, A1ChanIntent } from "./types";

function normalizedTerms(values: string[]) {
  return values
    .map(normalizeNavigatorText)
    .filter(Boolean);
}

function exactEntityScore(query: string, card: A1ChanKnowledgeCard) {
  const normalized = normalizeNavigatorText(query);
  if (!normalized) return 0;

  let score = 0;
  const entityTerms = normalizedTerms([card.id, card.title, ...card.aliases]);
  const broadTerms = normalizedTerms([...card.keywords, ...card.tags, ...card.terms]);

  for (const term of entityTerms) {
    if (!term) continue;
    if (normalized === term) {
      score = Math.max(score, card.kind === "project" ? 520 : 420);
    } else if (term.length >= 3 && normalized.includes(term)) {
      score = Math.max(score, card.kind === "project" ? 380 : 260);
    } else if (normalized.length >= 3 && term.includes(normalized)) {
      score = Math.max(score, card.kind === "project" ? 170 : 120);
    }
  }

  for (const term of broadTerms) {
    if (!term || term.length < 3) continue;
    if (normalized === term) {
      score = Math.max(score, 42);
    } else if (normalized.includes(term) || term.includes(normalized)) {
      score = Math.max(score, 28);
    }
  }

  return score;
}

function contextBoost(query: string, card: A1ChanKnowledgeCard, context: A1ChanContext, intent: A1ChanIntent) {
  let score = card.priority / 10;

  if (card.routeId === context.currentRouteId) score += 10;
  if (card.routeId === context.lastRouteId) score += 4;
  if (intent === "currentPage" && card.routeId === context.currentRouteId) score += 54;
  if (intent === "person" && card.kind === "person") score += 90;
  if (intent === "contact" && card.kind === "contact") score += 90;
  if (intent === "siteQuestion" && card.kind === "site") score += 62;
  if (intent === "writing" && (card.kind === "writing" || card.routeId === "writings")) score += 95;
  if (intent === "projectCollection" && card.id === "projects-collection") score += 100;
  if (intent === "detail" && context.lastRecordId && card.id === context.lastRecordId) score += 160;
  if (intent === "confusion" && context.lastRecordId && card.id === context.lastRecordId) score += 160;
  if (intent === "confusion" && card.routeId === context.currentRouteId) score += 34;
  if (intent === "open" && card.routeId === context.currentRouteId) score += 8;
  if (card.kind === "project" && includesAny(query, ["프로젝트", "project", "연구", "제품", "특허"])) score += 15;

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

  return miniSearch;
}

export function retrieveA1ChanContext(
  query: string,
  knowledgeCards: A1ChanKnowledgeCard[],
  context: A1ChanContext,
  intent: A1ChanIntent,
  limit = 6
) {
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
