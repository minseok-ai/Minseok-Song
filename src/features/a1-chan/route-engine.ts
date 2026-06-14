export type NavigatorConfidence = "high" | "medium" | "low";
export type NavigatorResultSource = "static" | "chrome-ai" | "lmstudio-dev";

export type NavigatorDeepLink = {
  label: string;
  hash: string;
  terms: string[];
};

export type NavigatorRoute = {
  id: string;
  label: string;
  path: string;
  num: string;
  description: string;
  aliases: string[];
  response: string;
  prompt: string;
  deepLinks: NavigatorDeepLink[];
};

export type NavigatorIntentResult = {
  answer: string;
  routeId: string;
  routeHref: string;
  confidence: NavigatorConfidence;
  deepLink?: string;
  reason?: string;
  source: NavigatorResultSource;
};

type NavigationLike = {
  id: string;
  label: string;
  path: string;
  num: string;
  contentEntry: string;
};

type PageLike = {
  description?: string;
};

const routeMetadata: Record<string, Omit<NavigatorRoute, "id" | "label" | "path" | "num" | "description">> = {
  home: {
    aliases: ["home", "start", "overview", "site", "map", "홈", "처음", "개요", "사이트", "구조"],
    response: "사이트 전체 구조와 주요 섹션을 빠르게 훑어볼 수 있는 시작 화면입니다.",
    prompt: "site overview",
    deepLinks: [
      { label: "Site surfaces", hash: "#surfaces", terms: ["surface", "section", "map", "site", "구조", "섹션"] },
      { label: "A1trategize band", hash: "#product-band", terms: ["product", "a1trategize", "전략", "제품"] }
    ]
  },
  about: {
    aliases: ["about", "profile", "career", "resume", "cv", "person", "민석", "송민석", "사람", "프로필", "경력", "소개"],
    response: "Minseok Song의 현재 역할, 연구 경험, 창업/제품 맥락을 설명하는 프로필 화면입니다.",
    prompt: "career profile",
    deepLinks: [
      { label: "Profile overview", hash: "#profile-overview", terms: ["profile", "overview", "소개", "프로필"] },
      { label: "Operating thesis", hash: "#profile-thesis", terms: ["thesis", "career", "경력", "관점", "철학"] }
    ]
  },
  "a1-firms": {
    aliases: ["strategy", "consulting", "firm", "a1", "product", "business", "전략", "컨설팅", "제품", "사업", "A1 Firms"],
    response: "A1 Firms와 A1trategize의 제품 방향, 전략 시스템, 운영 맥락을 설명하는 화면입니다.",
    prompt: "strategy system",
    deepLinks: [
      { label: "LLM router", hash: "#llm-router", terms: ["llm", "router", "model", "gemini", "pipeline", "모델", "라우터", "파이프라인"] },
      { label: "Domain verticals", hash: "#domain-verticals", terms: ["domain", "vertical", "industry", "도메인", "산업"] }
    ]
  },
  projects: {
    aliases: ["project", "research", "patent", "portfolio", "build", "논문", "연구", "특허", "프로젝트", "포트폴리오"],
    response: "15개의 공개 프로젝트를 A1 Firms 제품, 연구, 하드웨어, 사업화 관점으로 모아 둔 프로젝트 인덱스입니다.",
    prompt: "research projects",
    deepLinks: [
      { label: "Project ledger", hash: "#project-overview", terms: ["ledger", "overview", "status", "개요", "현황"] },
      { label: "A1 ecosystem", hash: "#a1-projects", terms: ["a1", "firm", "product", "제품", "사업"] },
      { label: "Research projects", hash: "#research-projects", terms: ["research", "patent", "academic", "연구", "특허", "논문"] }
    ]
  },
  writings: {
    aliases: ["writing", "article", "newsletter", "note", "source", "글", "뉴스레터", "리뷰", "노트", "아티클"],
    response: "뉴스레터, 소스 리뷰, 기술/전략 노트를 읽는 화면입니다.",
    prompt: "writing notes",
    deepLinks: [
      { label: "Writing index", hash: "#writing-index", terms: ["index", "article", "newsletter", "글", "뉴스레터", "목록"] }
    ]
  },
  contacts: {
    aliases: ["contact", "email", "linkedin", "github", "call", "연락", "메일", "협업", "미팅", "문의"],
    response: "협업, 자문, 제품 대화를 시작할 수 있는 공개 연락 채널입니다.",
    prompt: "contact channel",
    deepLinks: [
      { label: "Contact graph", hash: "#contact-graph", terms: ["graph", "channel", "email", "linkedin", "연락", "채널", "메일"] }
    ]
  }
};

export function createNavigatorRoutes(
  items: NavigationLike[],
  pageEntriesById: Map<string, PageLike>
): NavigatorRoute[] {
  return items.map((item) => {
    const page = pageEntriesById.get(item.contentEntry);
    const metadata = routeMetadata[item.id] ?? {
      aliases: [],
      response: page?.description ?? item.label,
      prompt: item.label.toLowerCase(),
      deepLinks: []
    };

    return {
      id: item.id,
      label: item.label,
      path: item.path,
      num: item.num,
      description: page?.description ?? item.label,
      aliases: metadata.aliases,
      response: metadata.response,
      prompt: metadata.prompt,
      deepLinks: metadata.deepLinks
    };
  });
}

export function normalizeNavigatorText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s:/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getNavigatorRoute(routes: NavigatorRoute[], id?: string | null): NavigatorRoute {
  const fallback = routes[0];
  if (!fallback) {
    throw new Error("A1 Chan requires at least one route.");
  }

  return routes.find((route) => route.id === id) ?? fallback;
}

export function getNavigatorRouteByPath(routes: NavigatorRoute[], pathname: string): NavigatorRoute {
  const fallback = routes[0];
  if (!fallback) {
    throw new Error("A1 Chan requires at least one route.");
  }

  const currentPath = pathname.replace(/\/$/, "") || "/";
  return routes.find((route) => (route.path.replace(/\/$/, "") || "/") === currentPath) ?? fallback;
}

export function extractGoQuery(query: string) {
  const patterns = [/^\/go\s+(.+)/i, /^go:\s*(.+)/i, /^이동\s+(.+)/i, /^열어\s+(.+)/i];
  const match = patterns.map((pattern) => query.match(pattern)).find(Boolean);
  return match?.[1]?.trim() || "";
}

export function isHelpQuery(query: string) {
  const normalized = normalizeNavigatorText(query);
  return /^\/help$/i.test(query) || normalized === "help" || normalized === "도움말";
}

function levenshteinDistance(a: string, b: string) {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i += 1) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function fuzzyMatch(query: string, term: string) {
  const maxLen = Math.max(query.length, term.length);
  if (!maxLen) return 0;
  return 1 - levenshteinDistance(query, term) / maxLen;
}

function scoreRoute(query: string, route: NavigatorRoute) {
  const normalized = normalizeNavigatorText(query);
  if (!normalized) return 0;

  const labels = [route.id, route.label, route.prompt, route.description, route.response, ...route.aliases]
    .map(normalizeNavigatorText)
    .filter(Boolean);

  let bestScore = 0;

  for (const term of labels) {
    if (normalized === term) {
      bestScore = Math.max(bestScore, 10);
    } else if (normalized.includes(term)) {
      bestScore = Math.max(bestScore, term.length >= 4 ? 6 : 3);
    } else if (term.includes(normalized) && normalized.length >= 3) {
      bestScore = Math.max(bestScore, 4);
    } else {
      const similarity = fuzzyMatch(normalized, term);
      if (similarity > 0.72) {
        bestScore = Math.max(bestScore, Math.floor(similarity * 4));
      }
    }
  }

  return bestScore;
}

export function selectDeepLink(query: string, route: NavigatorRoute) {
  const normalized = normalizeNavigatorText(query);
  if (!normalized) return undefined;

  return route.deepLinks.find((link) =>
    link.terms.some((term) => normalized.includes(normalizeNavigatorText(term)))
  );
}

export function resolveRouteHref(route: NavigatorRoute, deepLink?: string) {
  return `${route.path}${deepLink ?? ""}`;
}

export function buildNavigatorResult(
  route: NavigatorRoute,
  confidence: NavigatorConfidence,
  source: NavigatorResultSource,
  deepLink?: string
): NavigatorIntentResult {
  const link = deepLink ? route.deepLinks.find((item) => item.hash === deepLink) : undefined;
  const routeHref = resolveRouteHref(route, deepLink);
  const linkCopy = link ? ` 먼저 ${link.label} 쪽을 보면 좋겠습니다.` : "";

  if (confidence === "low") {
    return {
      answer: `정확히 맞는 섹션을 찾기 어려워요. 가장 가까운 ${route.label} 화면을 추천합니다.${linkCopy}`,
      routeId: route.id,
      routeHref,
      confidence,
      deepLink,
      source
    };
  }

  return {
    answer: `${route.label}로 안내할게요. ${route.response}${linkCopy}`,
    routeId: route.id,
    routeHref,
    confidence,
    deepLink,
    source
  };
}

export function recommendNavigatorRoute(
  query: string,
  routes: NavigatorRoute[],
  context: {
    currentRouteId?: string | null;
    lastRouteId?: string | null;
    userHistory?: string[];
    source?: NavigatorResultSource;
  } = {}
) {
  const directRanked = routes
    .map((route) => ({ route, score: scoreRoute(query, route) }))
    .sort((a, b) => b.score - a.score);

  let route = directRanked[0]?.route;
  let score = directRanked[0]?.score ?? 0;

  if (score === 0 && context.userHistory?.length) {
    const contextualQuery = [...context.userHistory.slice(-3), query].join(" ");
    const contextualRanked = routes
      .map((item) => ({ route: item, score: scoreRoute(contextualQuery, item) }))
      .sort((a, b) => b.score - a.score);

    if ((contextualRanked[0]?.score ?? 0) > 0) {
      route = contextualRanked[0].route;
      score = contextualRanked[0].score;
    }
  }

  if (!route || score === 0) {
    route =
      getNavigatorRoute(routes, context.lastRouteId) ||
      getNavigatorRoute(routes, context.currentRouteId) ||
      getNavigatorRoute(routes, "a1-firms");
  }

  const confidence: NavigatorConfidence = score >= 6 ? "high" : score > 0 ? "medium" : "low";
  const deepLink = selectDeepLink(query, route)?.hash;

  return buildNavigatorResult(route, confidence, context.source ?? "static", deepLink);
}

export function coerceConfidence(value: unknown): NavigatorConfidence {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}
