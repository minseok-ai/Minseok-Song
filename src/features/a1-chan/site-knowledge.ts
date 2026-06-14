import type {
  ContactEntry,
  PageEntry,
  ProjectEntry,
  WritingEntry
} from "../../lib/content/registry";
import type { NavigatorRoute } from "./route-engine";

export type A1ChanKnowledgeKind =
  | "site"
  | "person"
  | "page"
  | "section"
  | "project"
  | "writing"
  | "contact";

export type A1ChanKnowledgeCard = {
  id: string;
  kind: A1ChanKnowledgeKind;
  locale: "ko";
  title: string;
  aliases: string[];
  summary: string;
  facts: string[];
  keywords: string[];
  text: string;
  href: string;
  routeId: string;
  tags: string[];
  terms: string[];
  priority: number;
  source: string;
};

type CreateKnowledgeOptions = {
  routes: NavigatorRoute[];
  pages: PageEntry[];
  projects: ProjectEntry[];
  writings: WritingEntry[];
  contacts: ContactEntry[];
};

type BlockLike = {
  id?: string;
  type: string;
  title?: string;
  body?: string;
  hidden?: boolean;
  events?: Array<{ date: string; title: string; body?: string }>;
  stats?: Array<{ label: string; value: string; description?: string }>;
};

const routePathById = (routes: NavigatorRoute[], id: string) =>
  routes.find((route) => route.id === id)?.path ?? "/";

const pageRouteIdByPath = (routes: NavigatorRoute[], path: string) =>
  routes.find((route) => route.path === path)?.id ?? "home";

function compactText(parts: Array<string | undefined>) {
  return parts
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

function blockText(block: BlockLike) {
  if (block.hidden) return "";

  if (block.type === "timeline") {
    return block.events
      ?.map((event) => `${event.date}: ${event.title}. ${event.body ?? ""}`)
      .join(" ");
  }

  if (block.type === "stats") {
    return block.stats
      ?.map((stat) => `${stat.label}: ${stat.value}. ${stat.description ?? ""}`)
      .join(" ");
  }

  return compactText([block.title, block.body]);
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

function makeText(card: Pick<A1ChanKnowledgeCard, "title" | "aliases" | "summary" | "facts" | "keywords" | "tags">) {
  return compactText([
    card.title,
    ...card.aliases,
    card.summary,
    ...card.facts,
    ...card.keywords,
    ...card.tags
  ]);
}

function makeTerms(card: Pick<A1ChanKnowledgeCard, "title" | "aliases" | "summary" | "facts" | "keywords" | "tags" | "kind">) {
  return unique([
    card.kind,
    card.title,
    ...card.aliases,
    ...card.keywords,
    ...card.tags,
    ...termsFromText(compactText([card.title, card.summary, ...card.facts]))
  ]);
}

export function createA1ChanKnowledge({ routes, pages, projects, writings, contacts }: CreateKnowledgeOptions) {
  const cards: A1ChanKnowledgeCard[] = [];
  const publishedPages = pages.filter((entry) => entry.data.status === "published" && !entry.data.hidden);
  const publishedProjects = projects
    .filter((entry) => entry.data.status === "published" && !entry.data.hidden)
    .sort((a, b) => a.data.order - b.data.order);
  const aboutPage = pages.find((entry) => entry.id === "about")?.data;
  const projectsPage = pages.find((entry) => entry.id === "projects")?.data;
  const a1FirmsPage = pages.find((entry) => entry.id === "a1-firms")?.data;
  const aboutBlocks = (aboutPage?.blocks ?? []).filter((block) => !block.hidden) as BlockLike[];
  const aboutText = compactText([
    aboutPage?.hero?.title,
    aboutPage?.hero?.subtitle,
    aboutPage?.description,
    ...aboutBlocks.map(blockText)
  ]);

  const siteCardBase = {
    id: "site-overview",
    kind: "site" as const,
    locale: "ko" as const,
    title: "A1 Firms public site",
    aliases: ["A1 Firms", "Minseok Song site", "민석 포트폴리오", "사이트 개요"],
    summary: "Minseok Song, A1 Firms, A1trategize, projects, writings, and contact channels are organized in one public site.",
    facts: [
      "이 사이트는 Minseok Song의 프로필, A1 Firms 제품 맥락, 15개 프로젝트, 글, 연락 채널을 묶은 공개 운영면입니다.",
      "A1 Chan은 사이트 안의 공개 콘텐츠를 우선 검색하고, 가능하면 Chrome Built-in AI로 답변 표현을 보강합니다.",
      "외부 서버 LLM API 없이도 기본 검색과 설명은 사이트 DB를 기반으로 동작해야 합니다."
    ],
    keywords: ["site", "overview", "A1 Firms", "A1 Chan", "포트폴리오", "프로젝트"],
    href: "/",
    routeId: "home",
    tags: ["site", "overview", "A1 Firms"],
    priority: 84,
    source: "site"
  };
  cards.push({
    ...siteCardBase,
    text: makeText(siteCardBase),
    terms: makeTerms(siteCardBase)
  });

  const personCardBase = {
    id: "person-minseok-song",
    kind: "person" as const,
    locale: "ko" as const,
    title: "Minseok Song",
    aliases: ["Song Minseok", "민석", "송민석", "이 사람", "프로필", "경력"],
    summary: "Founder of A1trategize and R&D Intern at KAIST NNFC, working across semiconductor-energy research, AI strategy systems, robotics, and independently filed patents.",
    facts: [
      "현재 KAIST NNFC R&D Intern으로 평면 interdigitated cell 기반 차세대 마이크로 배터리 연구를 수행합니다.",
      "A1trategize Founder로 AI 기반 전략 시스템과 A1 Firms 제품 맥락을 구축하고 있습니다.",
      "Physics and Semiconductor-Energy Convergence Science 기반을 갖고 있으며, KRISS/Chungnam National University 연구 경험이 있습니다.",
      "독립적으로 기술 특허 2건을 self-filed했고, KSNT 1st Author 발표와 수상 이력이 있습니다."
    ],
    keywords: ["profile", "career", "KAIST NNFC", "A1trategize", "research", "patent", "경력", "연구"],
    href: `${routePathById(routes, "about")}#profile-overview`,
    routeId: "about",
    tags: ["profile", "career", "KAIST NNFC", "A1trategize"],
    priority: 100,
    source: "content/pages/about.json"
  };
  cards.push({
    ...personCardBase,
    text: compactText([makeText(personCardBase), aboutText]),
    terms: makeTerms(personCardBase)
  });

  const projectsOverviewBase = {
    id: "projects-collection",
    kind: "section" as const,
    locale: "ko" as const,
    title: "Projects collection",
    aliases: ["프로젝트 목록", "프로젝트 전체", "15개 프로젝트", "project ledger", "portfolio projects"],
    summary: projectsPage?.description || "Portfolio notes, build logs, research artifacts, and selected project writing.",
    facts: [
      `현재 공개된 프로젝트는 ${publishedProjects.length}개입니다.`,
      "A1 Firms 제품/로보틱스 계열, AI/소프트웨어, 반도체/에너지 연구, 의료/계측, 사업화 프로젝트가 함께 정리되어 있습니다.",
      "각 프로젝트는 별도 지식 레코드를 가지고 있어 특정 프로젝트 이름이나 문제 상황으로 질문할 수 있습니다."
    ],
    keywords: ["projects", "project ledger", "research", "A1 Firms", "프로젝트", "연구", "분류"],
    href: `${routePathById(routes, "projects")}#project-overview`,
    routeId: "projects",
    tags: ["projects", "overview"],
    priority: 91,
    source: "content/pages/projects.json"
  };
  cards.push({
    ...projectsOverviewBase,
    text: makeText(projectsOverviewBase),
    terms: makeTerms(projectsOverviewBase)
  });

  if (a1FirmsPage) {
    const a1CardBase = {
      id: "a1-firms-product-context",
      kind: "section" as const,
      locale: "ko" as const,
      title: "A1 Firms and A1trategize product context",
      aliases: ["A1 Firms", "A1 Firm", "A1trategize", "전략 시스템", "제품 방향"],
      summary: a1FirmsPage.description,
      facts: [
        "A1 Firms는 A1trategize를 중심으로 한 공개 제품/운영 맥락입니다.",
        "실제 앱은 a1trategize.com에서 별도로 운영되고, 이 사이트는 제품 배경, 프로젝트, 글, 연락 경로를 설명합니다.",
        "A1trategize는 전략 리서치와 컨설팅 보고서 생성을 돕는 B2B 전략 인텔리전스 시스템입니다."
      ],
      keywords: ["A1 Firms", "A1trategize", "strategy", "consulting", "product", "전략", "제품"],
      href: routePathById(routes, "a1-firms"),
      routeId: "a1-firms",
      tags: ["product", "strategy", "A1 Firms"],
      priority: 94,
      source: "content/pages/a1-firms.json"
    };
    cards.push({
      ...a1CardBase,
      text: makeText(a1CardBase),
      terms: makeTerms(a1CardBase)
    });
  }

  for (const entry of publishedPages) {
    const routeId = pageRouteIdByPath(routes, entry.data.path);
    const hero = entry.data.hero;
    const visibleBlocks = entry.data.blocks.filter((block) => !block.hidden) as BlockLike[];
    const facts = unique([
      entry.data.description,
      hero?.subtitle,
      ...visibleBlocks.map(blockText)
    ]).slice(0, 6);
    const pageCardBase = {
      id: `page-${entry.id}`,
      kind: "page" as const,
      locale: "ko" as const,
      title: entry.data.title,
      aliases: unique([entry.data.title, entry.data.navLabel, entry.data.layoutType]),
      summary: entry.data.description || hero?.subtitle || entry.data.title,
      facts,
      keywords: unique([entry.data.layoutType, entry.data.navLabel, "page", "화면", "페이지"]),
      href: entry.data.path,
      routeId,
      tags: [entry.data.layoutType, entry.data.navLabel],
      priority: routeId === "about" ? 82 : 74,
      source: `content/pages/${entry.id}.json`
    };
    cards.push({
      ...pageCardBase,
      text: makeText(pageCardBase),
      terms: makeTerms(pageCardBase)
    });

    for (const block of visibleBlocks) {
      const text = blockText(block);
      if (!text) continue;
      const sectionCardBase = {
        id: `section-${entry.id}-${block.id ?? block.title ?? block.type}`,
        kind: "section" as const,
        locale: "ko" as const,
        title: block.title || `${entry.data.title} section`,
        aliases: unique([block.title, block.id, entry.data.title, entry.data.navLabel]),
        summary: text.slice(0, 220),
        facts: [text],
        keywords: unique([entry.data.layoutType, entry.data.navLabel, block.type, "section", "섹션"]),
        href: entry.data.path,
        routeId,
        tags: [entry.data.layoutType, block.type],
        priority: 70,
        source: `content/pages/${entry.id}.json#${block.id ?? block.type}`
      };
      cards.push({
        ...sectionCardBase,
        text: makeText(sectionCardBase),
        terms: makeTerms(sectionCardBase)
      });
    }
  }

  for (const entry of publishedProjects) {
    const knowledge = entry.data.knowledge?.ko;
    const facts = unique([
      knowledge?.oneLiner || entry.data.summary,
      knowledge?.problem,
      knowledge?.approach,
      knowledge?.technicalCore,
      knowledge?.evidence,
      knowledge?.impact,
      knowledge?.statusNote
    ]);
    const projectCardBase = {
      id: `project-${entry.id}`,
      kind: "project" as const,
      locale: "ko" as const,
      title: entry.data.title,
      aliases: unique([entry.id, entry.data.title, ...(knowledge?.aliases ?? [])]),
      summary: knowledge?.oneLiner || entry.data.summary,
      facts,
      keywords: unique([...(knowledge?.keywords ?? []), ...entry.data.tags, entry.data.year, "project", "프로젝트"]),
      href: `${routePathById(routes, "projects")}#project-${entry.id}`,
      routeId: "projects",
      tags: unique([...entry.data.tags, entry.data.year]),
      priority: entry.id === "a1trategize" ? 95 : entry.data.tags.includes("A1 Firms") ? 82 : 68,
      source: `content/projects/${entry.id}.json`
    };
    cards.push({
      ...projectCardBase,
      text: makeText(projectCardBase),
      terms: makeTerms(projectCardBase)
    });
  }

  for (const entry of writings.filter((item) => item.data.status === "published" && !item.data.hidden)) {
    const writingCardBase = {
      id: `writing-${entry.id}`,
      kind: "writing" as const,
      locale: "ko" as const,
      title: entry.data.title,
      aliases: unique([entry.data.title, entry.id, "글", "아티클", "뉴스레터"]),
      summary: entry.data.summary,
      facts: unique([entry.data.summary, entry.data.body]).slice(0, 4),
      keywords: unique([...entry.data.tags, "writing", "article", "글", "뉴스레터"]),
      href: `/writings/${entry.id}`,
      routeId: "writings",
      tags: entry.data.tags,
      priority: 54,
      source: `content/writings/${entry.id}.json`
    };
    cards.push({
      ...writingCardBase,
      text: makeText(writingCardBase),
      terms: makeTerms(writingCardBase)
    });
  }

  for (const entry of contacts) {
    const visibleChannels = entry.data.channels.filter((channel) => channel.visible !== false);
    const facts = visibleChannels.map((channel) => `${channel.label}: ${channel.value}`);
    const contactCardBase = {
      id: `contact-${entry.id}`,
      kind: "contact" as const,
      locale: "ko" as const,
      title: entry.data.title,
      aliases: ["contact", "email", "linkedin", "github", "연락", "메일", "협업", "문의"],
      summary: "협업, 자문, 제품 대화는 Email, LinkedIn, GitHub 채널로 시작할 수 있습니다.",
      facts,
      keywords: unique(["contact", "email", "linkedin", "github", "collaboration", "연락", "협업", ...visibleChannels.map((channel) => channel.label)]),
      href: `${routePathById(routes, "contacts")}#contact-graph`,
      routeId: "contacts",
      tags: visibleChannels.map((channel) => channel.label),
      priority: 76,
      source: `content/contacts/${entry.id}.json`
    };
    cards.push({
      ...contactCardBase,
      text: makeText(contactCardBase),
      terms: makeTerms(contactCardBase)
    });
  }

  return cards;
}
