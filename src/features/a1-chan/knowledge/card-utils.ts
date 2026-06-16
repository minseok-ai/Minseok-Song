type CardTextShape = {
  kind?: string;
  title: string;
  aliases: string[];
  summary: string;
  facts: string[];
  keywords: string[];
  tags: string[];
  shortAnswer?: string;
  detailAnswer?: string;
  proofPoints?: string[];
  nextQuestions?: string[];
};

export function compactText(parts: Array<string | undefined>) {
  return parts
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function unique(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

function termsFromText(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .normalize("NFKC")
        .split(/[^\p{L}\p{N}]+/u)
        .filter((term) => term.length >= 2)
        .slice(0, 64)
    )
  );
}

export function makeText(card: CardTextShape) {
  return compactText([
    card.title,
    ...card.aliases,
    card.summary,
    card.shortAnswer,
    card.detailAnswer,
    ...card.facts,
    ...(card.proofPoints ?? []),
    ...card.keywords,
    ...card.tags,
    ...(card.nextQuestions ?? [])
  ]);
}

export function makeTerms(card: CardTextShape) {
  return unique([
    card.kind,
    card.title,
    ...card.aliases,
    ...card.keywords,
    ...card.tags,
    ...termsFromText(compactText([card.title, card.summary, card.shortAnswer, card.detailAnswer, ...card.facts]))
  ]);
}

export function completeA1ChanCard<TCard extends CardTextShape>(card: TCard) {
  return {
    ...card,
    text: makeText(card),
    terms: makeTerms(card)
  };
}
