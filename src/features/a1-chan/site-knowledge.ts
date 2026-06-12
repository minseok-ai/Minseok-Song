import type {
  ContactEntry,
  PageEntry,
  ProjectEntry,
  WritingEntry
} from "../../lib/content/registry";
import type { NavigatorRoute } from "./route-engine";

export type A1ChanKnowledgeKind = "site" | "person" | "page" | "project" | "writing" | "contact";

export type A1ChanKnowledgeCard = {
  id: string;
  kind: A1ChanKnowledgeKind;
  title: string;
  summary: string;
  text: string;
  href: string;
  routeId: string;
  tags: string[];
  terms: string[];
  priority: number;
};

type CreateKnowledgeOptions = {
  routes: NavigatorRoute[];
  pages: PageEntry[];
  projects: ProjectEntry[];
  writings: WritingEntry[];
  contacts: ContactEntry[];
};

type BlockLike = {
  type: string;
  title?: string;
  body?: string;
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

function blockText(block: BlockLike) {
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
        .split(/[^\p{L}\p{N}]+/u)
        .filter((term) => term.length >= 2)
        .slice(0, 36)
    )
  );
}

export function createA1ChanKnowledge({ routes, pages, projects, writings, contacts }: CreateKnowledgeOptions) {
  const cards: A1ChanKnowledgeCard[] = [];
  const aboutPage = pages.find((entry) => entry.id === "about")?.data;
  const aboutText = compactText([
    aboutPage?.hero?.title,
    aboutPage?.hero?.subtitle,
    aboutPage?.description,
    ...(aboutPage?.blocks ?? []).map((block) => blockText(block as BlockLike))
  ]);

  cards.push({
    id: "site-overview",
    kind: "site",
    title: "A1 Firms public site",
    summary:
      "Minseok Song, A1trategize, projects, writings, and contact channels are organized as a public operating surface.",
    text:
      "This site is an editorial operating site for Minseok Song, A1 Firms, and AI-native strategy systems. It helps visitors understand the profile, product context, projects, writing notes, and collaboration channels.",
    href: "/",
    routeId: "home",
    tags: ["site", "overview", "A1 Firms"],
    terms: ["site", "overview", "홈", "사이트", "구조", "무엇", "뭐야", "a1", "firms"],
    priority: 82
  });

  cards.push({
    id: "person-minseok-song",
    kind: "person",
    title: "Minseok Song",
    summary:
      "Founder of A1trategize and R&D Intern at KAIST NNFC, with work across semiconductor-energy research, AI strategy systems, robotics, and independently filed patents.",
    text: aboutText,
    href: `${routePathById(routes, "about")}#profile-overview`,
    routeId: "about",
    tags: ["profile", "career", "person", "KAIST NNFC", "A1trategize"],
    terms: [
      "minseok",
      "song",
      "민석",
      "송민석",
      "이 사람",
      "누구",
      "프로필",
      "소개",
      "약력",
      "커리어",
      "경력",
      "사람",
      "founder",
      "kaist",
      "nnfc"
    ],
    priority: 100
  });

  for (const entry of pages.filter((item) => item.data.status === "published" && !item.data.hidden)) {
    const routeId = pageRouteIdByPath(routes, entry.data.path);
    const hero = entry.data.hero;
    const text = compactText([
      entry.data.title,
      entry.data.description,
      hero?.title,
      hero?.subtitle,
      ...entry.data.blocks.map((block) => blockText(block as BlockLike))
    ]);

    cards.push({
      id: `page-${entry.id}`,
      kind: "page",
      title: entry.data.title,
      summary: entry.data.description || hero?.subtitle || entry.data.title,
      text,
      href: entry.data.path,
      routeId,
      tags: [entry.data.layoutType, entry.data.navLabel],
      terms: [
        entry.data.title,
        entry.data.navLabel,
        entry.data.layoutType,
        "페이지",
        "여기",
        "화면",
        ...termsFromText(text)
      ],
      priority: 72
    });
  }

  for (const entry of projects.filter((item) => item.data.status === "published" && !item.data.hidden)) {
    const text = compactText([
      entry.data.title,
      entry.data.summary,
      entry.data.year,
      entry.data.tags.join(" ")
    ]);

    cards.push({
      id: `project-${entry.id}`,
      kind: "project",
      title: entry.data.title,
      summary: entry.data.summary,
      text,
      href: "/projects",
      routeId: "projects",
      tags: entry.data.tags,
      terms: [
        entry.data.title,
        "project",
        "프로젝트",
        "작업",
        "연구",
        "제품",
        ...entry.data.tags,
        ...termsFromText(text)
      ],
      priority: 64
    });
  }

  for (const entry of writings.filter((item) => item.data.status === "published" && !item.data.hidden)) {
    const text = compactText([
      entry.data.title,
      entry.data.summary,
      entry.data.body,
      entry.data.tags.join(" ")
    ]);

    cards.push({
      id: `writing-${entry.id}`,
      kind: "writing",
      title: entry.data.title,
      summary: entry.data.summary,
      text,
      href: `/writings/${entry.id}`,
      routeId: "writings",
      tags: entry.data.tags,
      terms: [
        entry.data.title,
        "writing",
        "글",
        "노트",
        "뉴스레터",
        "리뷰",
        ...entry.data.tags,
        ...termsFromText(text)
      ],
      priority: 52
    });
  }

  for (const entry of contacts) {
    const visibleChannels = entry.data.channels.filter((channel) => channel.visible !== false);
    const text = visibleChannels
      .map((channel) => `${channel.label}: ${channel.value}`)
      .join(" ");

    cards.push({
      id: `contact-${entry.id}`,
      kind: "contact",
      title: entry.data.title,
      summary: "Email, LinkedIn, and GitHub are available for collaboration and product conversations.",
      text,
      href: `${routePathById(routes, "contacts")}#contact-graph`,
      routeId: "contacts",
      tags: visibleChannels.map((channel) => channel.label),
      terms: [
        "contact",
        "email",
        "linkedin",
        "github",
        "연락",
        "메일",
        "협업",
        "미팅",
        "문의",
        ...visibleChannels.map((channel) => channel.label),
        ...termsFromText(text)
      ],
      priority: 70
    });
  }

  return cards;
}
