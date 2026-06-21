import type {
  ContactEntry,
  PageEntry,
  ProjectEntry,
  WritingEntry
} from "../../lib/content/registry";
import type { NavigatorRoute } from "./route-engine";
import { compactText, completeA1ChanCard, unique } from "./knowledge/card-utils";
import { createSeedA1ChanCards } from "./knowledge/seed-cards";

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
  shortAnswer?: string;
  detailAnswer?: string;
  facts: string[];
  proofPoints?: string[];
  nextQuestions?: string[];
  keywords: string[];
  text: string;
  href: string;
  routeId: string;
  tags: string[];
  terms: string[];
  priority: number;
  source: string;
  access?: "public" | "summaryOnly" | "pendingLocked";
  lockedNotice?: string;
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

export const routePathById = (routes: NavigatorRoute[], id: string) =>
  routes.find((route) => route.id === id)?.path ?? "/";

const pageRouteIdByPath = (routes: NavigatorRoute[], path: string) =>
  routes.find((route) => route.path === path)?.id ?? "home";

const pendingLockedProjectIds = new Set(["interdigitated-devices"]);

const pendingLockedProjectFacts = [
  "Planar Micro-Battery Architecture는 현재 Pending 잠금 상태로 공개되어 있습니다.",
  "세부 공정, 장비 조건, 측정 정보는 공개 카드와 A1 Chan 답변에서 의도적으로 모자이크 처리됩니다.",
  "Projects 화면에서는 자물쇠형 Pending 카드로만 노출됩니다."
];

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

  cards.push(
    ...createSeedA1ChanCards({
      routes,
      publishedProjectsCount: publishedProjects.length,
      aboutText,
      projectsDescription: projectsPage?.description,
      a1FirmsDescription: a1FirmsPage?.description
    })
  );

  for (const entry of publishedPages) {
    const routeId = pageRouteIdByPath(routes, entry.data.path);
    const hero = entry.data.hero;
    const copy = entry.data.assistant;
    const visibleBlocks = entry.data.blocks.filter((block) => !block.hidden) as BlockLike[];
    const facts = unique([
      copy?.summary,
      hero?.subtitle,
      ...visibleBlocks.map(blockText)
    ]).slice(0, 6);
    const pageCardBase = {
      id: `page-${entry.id}`,
      kind: "page" as const,
      locale: "ko" as const,
      title: entry.data.title,
      aliases: unique([entry.data.title, entry.data.navLabel, entry.data.layoutType]),
      summary: copy?.summary || entry.data.description || hero?.subtitle || entry.data.title,
      shortAnswer: copy?.shortAnswer || `${entry.data.navLabel} 화면은 공개 콘텐츠를 확인하는 섹션입니다.`,
      detailAnswer: copy?.detailAnswer || compactText([
        `${entry.data.navLabel} 화면에서는 사이트의 공개 맥락을 볼 수 있습니다.`,
        visibleBlocks.length ? "본문 블록과 화면 내 섹션을 함께 근거로 삼아 현재 페이지 질문에 답합니다." : "필요한 경우 관련 route와 콘텐츠 카드로 이어집니다."
      ]),
      facts,
      proofPoints: copy?.proofPoints || unique([hero?.subtitle, ...visibleBlocks.map((block) => block.title)]).slice(0, 4),
      nextQuestions: copy?.nextQuestions || [
        "이 화면에서 중요한 건 뭐야?",
        "관련 프로젝트는?",
        "다음에 어디를 보면 돼?"
      ],
      keywords: unique([entry.data.layoutType, entry.data.navLabel, "page", "화면", "페이지"]),
      href: entry.data.path,
      routeId,
      tags: [entry.data.layoutType, entry.data.navLabel],
      priority: routeId === "about" ? 82 : 74,
      source: `content/pages/${entry.id}.json`
    };
    cards.push(completeA1ChanCard(pageCardBase));

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
        shortAnswer: text.slice(0, 260),
        detailAnswer: text,
        facts: [text],
        proofPoints: [text.slice(0, 220)],
        nextQuestions: ["이 섹션을 더 쉽게 설명해줘", `${entry.data.navLabel} 화면으로 안내해줘`],
        keywords: unique([entry.data.layoutType, entry.data.navLabel, block.type, "section", "섹션"]),
        href: entry.data.path,
        routeId,
        tags: [entry.data.layoutType, block.type],
        priority: 70,
        source: `content/pages/${entry.id}.json#${block.id ?? block.type}`
      };
      cards.push(completeA1ChanCard(sectionCardBase));
    }
  }

  for (const entry of publishedProjects) {
    const knowledge = entry.data.knowledge?.ko;
    const isPendingLockedProject = pendingLockedProjectIds.has(entry.id);
    const facts = isPendingLockedProject
      ? pendingLockedProjectFacts
      : unique([
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
      summary: isPendingLockedProject ? pendingLockedProjectFacts[0] : knowledge?.oneLiner || entry.data.summary,
      facts,
      shortAnswer: isPendingLockedProject ? pendingLockedProjectFacts[0] : knowledge?.oneLiner || entry.data.summary,
      detailAnswer: isPendingLockedProject
        ? pendingLockedProjectFacts.join(" ")
        : compactText([
            knowledge?.oneLiner || entry.data.summary,
            knowledge?.problem ? `문제의식: ${knowledge.problem}` : undefined,
            knowledge?.approach ? `접근: ${knowledge.approach}` : undefined,
            knowledge?.technicalCore ? `기술 핵심: ${knowledge.technicalCore}` : undefined
          ]),
      proofPoints: isPendingLockedProject
        ? pendingLockedProjectFacts.slice(1)
        : unique([knowledge?.evidence, knowledge?.impact, knowledge?.statusNote]).slice(0, 4),
      nextQuestions: isPendingLockedProject
        ? ["왜 Pending이야?", "공개 가능한 범위는?", "다른 연구 프로젝트는?"]
        : ["문제의식은?", "기술 핵심은?", "근거와 상태는?"],
      keywords: unique([...(knowledge?.keywords ?? []), ...entry.data.tags, entry.data.year, "project", "프로젝트", ...(isPendingLockedProject ? ["pending", "locked", "잠금", "모자이크"] : [])]),
      href: `${routePathById(routes, "projects")}#project-${entry.id}`,
      routeId: "projects",
      tags: unique([...entry.data.tags, entry.data.year, ...(isPendingLockedProject ? ["Pending", "Locked"] : [])]),
      priority: Math.max(entry.data.tags.includes("A1 Firms") ? 82 : 68, 96 - entry.data.order),
      source: `content/projects/${entry.id}.json`,
      access: isPendingLockedProject ? "pendingLocked" as const : "public" as const,
      lockedNotice: isPendingLockedProject
        ? "This project is pending and locked. A1 Chan can only discuss the public summary and will not expose detailed fabrication/process information."
        : undefined
    };
    cards.push(completeA1ChanCard(projectCardBase));
  }

  for (const entry of writings.filter((item) => item.data.status === "published" && !item.data.hidden)) {
    const writingCardBase = {
      id: `writing-${entry.id}`,
      kind: "writing" as const,
      locale: "ko" as const,
      title: entry.data.title,
      aliases: unique([entry.data.title, entry.id, "글", "아티클", "뉴스레터"]),
      summary: entry.data.summary,
      shortAnswer: `${entry.data.title} 글은 ${entry.data.summary}`,
      detailAnswer: compactText([entry.data.summary, entry.data.body]).slice(0, 520),
      facts: unique([entry.data.summary, entry.data.body]).slice(0, 4),
      proofPoints: unique([entry.data.date, ...entry.data.tags, entry.data.summary]).slice(0, 5),
      nextQuestions: ["이 글 요약해줘", "다른 글은 어디서 봐?", "관련 프로젝트가 있어?"],
      keywords: unique([...entry.data.tags, "writing", "article", "글", "뉴스레터"]),
      href: `/writings/${entry.id}`,
      routeId: "writings",
      tags: entry.data.tags,
      priority: 54,
      source: `content/writings/${entry.id}.json`
    };
    cards.push(completeA1ChanCard(writingCardBase));
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
      shortAnswer: "연락은 공개 채널 기준으로 Email, LinkedIn, GitHub에서 시작할 수 있습니다.",
      detailAnswer: "협업, 자문, 제품 대화처럼 목적이 분명한 대화는 Contacts 화면의 공개 채널에서 이어가면 됩니다.",
      facts,
      proofPoints: facts,
      nextQuestions: ["이메일 주소 알려줘", "협업 문의는 어디로 해?", "LinkedIn으로 연결해줘"],
      keywords: unique(["contact", "email", "linkedin", "github", "collaboration", "연락", "협업", ...visibleChannels.map((channel) => channel.label)]),
      href: `${routePathById(routes, "contacts")}#contact-graph`,
      routeId: "contacts",
      tags: visibleChannels.map((channel) => channel.label),
      priority: 76,
      source: `content/contacts/${entry.id}.json`
    };
    cards.push(completeA1ChanCard(contactCardBase));
  }

  return cards;
}
