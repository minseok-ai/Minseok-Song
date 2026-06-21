import type { NavigatorRoute } from "../route-engine";
import type { A1ChanKnowledgeCard } from "../site-knowledge";
import { completeA1ChanCard } from "./card-utils";

type CreateSeedCardsOptions = {
  routes: NavigatorRoute[];
  publishedProjectsCount: number;
  aboutText: string;
  projectsDescription?: string;
  a1FirmsDescription?: string;
};

const routePathById = (routes: NavigatorRoute[], id: string) =>
  routes.find((route) => route.id === id)?.path ?? "/";

export function createSeedA1ChanCards({
  routes,
  publishedProjectsCount,
  aboutText,
  projectsDescription,
  a1FirmsDescription
}: CreateSeedCardsOptions): A1ChanKnowledgeCard[] {
  const siteCardBase = {
    id: "site-overview",
    kind: "site" as const,
    locale: "ko" as const,
    title: "A1 Firms public site",
    aliases: ["A1 Firms", "Minseok Song site", "민석 포트폴리오", "사이트 개요", "홈", "home"],
    summary: "Minseok Song, A1 Firms, A1trategize, projects, writings, and contact channels are organized in one public site.",
    shortAnswer: "이 사이트는 Minseok Song의 프로필, A1 Firms 제품 맥락, 프로젝트, 글, 연락 채널을 한 번에 탐색하는 공개 운영면입니다.",
    detailAnswer: "A1 Chan은 이 공개 콘텐츠를 근거로 답하고, 질문 의도에 맞는 화면과 다음 액션을 함께 이어주는 사이트 concierge입니다.",
    facts: [
      `이 사이트는 Minseok Song의 프로필, A1 Firms 제품 맥락, ${publishedProjectsCount}개 프로젝트, 글, 연락 채널을 묶은 공개 운영면입니다.`,
      "A1 Chan은 사이트 안의 공개 콘텐츠를 우선 검색하고, 가능하면 Chrome Built-in AI로 답변 표현을 보강합니다.",
      "외부 서버 LLM API 없이도 기본 검색과 설명은 사이트 DB를 기반으로 동작해야 합니다."
    ],
    proofPoints: [
      "상단 내비게이션은 Home, About, A1 Firms, Projects, Writings, Contacts로 구성됩니다.",
      "A1 Chan은 서버의 정적 검색 결과를 먼저 만들고 브라우저 AI는 선택적으로 표현만 보정합니다."
    ],
    nextQuestions: ["A1trategize가 뭐야?", "프로젝트 전체를 분류해줘", "민석은 누구야?"],
    keywords: ["site", "overview", "A1 Firms", "A1 Chan", "포트폴리오", "프로젝트", "홈"],
    href: "/",
    routeId: "home",
    tags: ["site", "overview", "A1 Firms"],
    priority: 84,
    source: "site"
  };

  const personCardBase = {
    id: "person-minseok-song",
    kind: "person" as const,
    locale: "ko" as const,
    title: "Minseok Song",
    aliases: ["Song Minseok", "민석", "송민석", "이 사람", "프로필", "경력"],
    summary: "Founder of Minseok Song & Company and Research Intern at KAIST NNFC, working across semiconductor-energy research, AI strategy systems, KRISS ultrasonic research, robotics, and independently filed patents.",
    shortAnswer: "Minseok Song은 Minseok Song & Company Founder이자 KAIST NNFC Research Intern으로, 반도체/에너지 연구와 AI 전략 시스템을 함께 다루고 있습니다.",
    detailAnswer: "물리와 반도체-에너지 융합 기반 위에서 마이크로 배터리, KRISS 초음파 연구, 로보틱스 제어 구상, Minseok Song & Company 제품 맥락을 연결해 온 프로필입니다.",
    facts: [
      "현재 KAIST NNFC Research Intern으로 평면 interdigitated cell 기반 차세대 마이크로 배터리 연구를 수행합니다.",
      "Minseok Song & Company Founder로 AI 기반 전략 시스템과 A1 Firms 제품 맥락을 구축하고 있습니다.",
      "2024년 9월부터 11월까지 KRISS Collaborator로 학기 병행 중 지도 박사의 구두 허락 하에 독립 학생 연구원으로 출근하며 초음파 혈당 연구를 1저자로 수행했습니다.",
      "2024년 7월부터 8월까지 KRISS Research Intern으로 초음파 계측과 고감쇠 시편 식별 경험을 수행했습니다.",
      "Physics and Semiconductor-Energy Convergence Science 기반을 갖고 있으며, Chungnam National University 연구 경험이 있습니다.",
      "독립적으로 기술 특허 2건을 self-filed했고, KSNT 1st Author 발표와 수상 이력이 있습니다."
    ],
    proofPoints: [
      "About 페이지의 timeline과 key milestones가 KAIST NNFC, Minseok Song & Company, KRISS, CNU 이력을 연결합니다.",
      "Projects에는 A1trategize, RA1, 마이크로 배터리, 초음파 계측 등 연결 프로젝트가 공개되어 있습니다."
    ],
    nextQuestions: ["Minseok Song & Company와 어떤 관련이 있어?", "연구 프로젝트를 보여줘", "연락하고 싶어"],
    keywords: ["profile", "career", "KAIST NNFC", "Minseok Song & Company", "KRISS Collaborator", "Research Intern", "research", "patent", "경력", "연구"],
    href: `${routePathById(routes, "about")}#profile-overview`,
    routeId: "about",
    tags: ["profile", "career", "KAIST NNFC", "Minseok Song & Company", "KRISS"],
    priority: 100,
    source: "content/pages/about.json"
  };

  const projectsOverviewBase = {
    id: "projects-collection",
    kind: "section" as const,
    locale: "ko" as const,
    title: "Projects collection",
    aliases: ["프로젝트", "프로젝트 목록", "프로젝트 전체", `${publishedProjectsCount}개 프로젝트`, "project ledger", "portfolio projects"],
    summary: projectsDescription || "Portfolio notes, build logs, research artifacts, and selected project writing.",
    shortAnswer: `Projects에는 현재 ${publishedProjectsCount}개의 공개 프로젝트가 있으며, A1 Firms 제품, AI/소프트웨어, 반도체/에너지 연구, 의료/계측, 사업화 경험을 함께 묶어 보여줍니다.`,
    detailAnswer: "프로젝트 이름이나 문제 상황으로 물어보면 각 카드의 문제의식, 접근 방식, 기술 핵심, 근거, 상태를 나누어 설명할 수 있습니다.",
    facts: [
      `현재 공개된 프로젝트는 ${publishedProjectsCount}개입니다.`,
      "A1 Firms 제품/로보틱스 계열, AI/소프트웨어, 반도체/에너지 연구, 의료/계측, 사업화 프로젝트가 함께 정리되어 있습니다.",
      "각 프로젝트는 별도 지식 레코드를 가지고 있어 특정 프로젝트 이름이나 문제 상황으로 질문할 수 있습니다."
    ],
    proofPoints: [
      "각 project JSON에는 oneLiner, problem, approach, technicalCore, evidence, impact, statusNote가 구조화되어 있습니다.",
      "Projects 화면은 전체 프로젝트를 분류하고 개별 anchor로 연결합니다."
    ],
    nextQuestions: ["RA1 자세히 설명해줘", "A1 Firms 계열만 보여줘", "연구 프로젝트를 분류해줘"],
    keywords: ["projects", "project ledger", "research", "A1 Firms", "프로젝트", "연구", "분류"],
    href: `${routePathById(routes, "projects")}#project-overview`,
    routeId: "projects",
    tags: ["projects", "overview"],
    priority: 91,
    source: "content/pages/projects.json"
  };

  const cards = [
    completeA1ChanCard(siteCardBase),
    {
      ...completeA1ChanCard(personCardBase),
      text: `${completeA1ChanCard(personCardBase).text} ${aboutText}`.trim()
    },
    completeA1ChanCard(projectsOverviewBase)
  ];

  if (a1FirmsDescription) {
    const a1CardBase = {
      id: "a1-firms-product-context",
      kind: "section" as const,
      locale: "ko" as const,
      title: "A1 Firms and A1trategize product context",
      aliases: ["A1 Firms", "A1 Firm", "A1trategize", "전략 시스템", "제품 방향"],
      summary: a1FirmsDescription,
      shortAnswer: "A1 Firms는 A1trategize를 중심으로 한 공개 제품/운영 맥락이며, 실제 앱은 a1trategize.com에서 별도로 운영됩니다.",
      detailAnswer: "이 사이트의 A1 Firms 화면은 제품 배경, 전략 시스템 방향, 관련 프로젝트와 글을 설명하고, 실제 서비스 사용은 별도 앱으로 이어지는 구조입니다.",
      facts: [
        "A1 Firms는 A1trategize를 중심으로 한 공개 제품/운영 맥락입니다.",
        "실제 앱은 a1trategize.com에서 별도로 운영되고, 이 사이트는 제품 배경, 프로젝트, 글, 연락 경로를 설명합니다.",
        "A1trategize는 전략 리서치와 컨설팅 보고서 생성을 돕는 B2B 전략 인텔리전스 시스템입니다."
      ],
      proofPoints: [
        "A1 Firms route는 /A1-Firm이며, CTA는 a1trategize.com 앱으로 연결됩니다.",
        "A1trategize project card는 launched 상태의 핵심 A1 Firms 제품 프로젝트입니다."
      ],
      nextQuestions: ["A1trategize가 뭐야?", "A1 Firms 프로젝트를 보여줘", "실제 앱은 어디야?"],
      keywords: ["A1 Firms", "A1trategize", "strategy", "consulting", "product", "전략", "제품"],
      href: routePathById(routes, "a1-firms"),
      routeId: "a1-firms",
      tags: ["product", "strategy", "A1 Firms"],
      priority: 94,
      source: "content/pages/a1-firms.json"
    };
    cards.push(completeA1ChanCard(a1CardBase));
  }

  return cards;
}
