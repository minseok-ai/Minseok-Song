import { normalizeNavigatorText } from "../route-engine";
import type { A1ChanDetectedLanguage, A1ChanIntent } from "./types";

const intentTerms: Record<Exclude<A1ChanIntent, "empty" | "knowledgeQuestion">, string[]> = {
  currentPage: [
    "이 페이지",
    "현재 페이지",
    "이 화면",
    "여기",
    "무슨 페이지",
    "지금 화면",
    "현재 화면",
    "what is this page",
    "this page",
    "current page"
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
    "프로젝트",
    "프로젝트들",
    "프로젝트 전체",
    "프로젝트 목록",
    "전체 프로젝트",
    "분류",
    "정리",
    "projects",
    "project",
    "project list",
    "portfolio"
  ],
  smalltalk: [
    "안녕",
    "안녕하세요",
    "하이",
    "hello",
    "hi",
    "배고프",
    "졸려",
    "심심",
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
    "무슨 말",
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
  ],
  capability: [
    "a1 chan",
    "chan",
    "챈",
    "무엇을 할 수",
    "뭐 할 수",
    "사용법",
    "도움말",
    "help",
    "capability",
    "할 수 있어"
  ],
  writing: [
    "글",
    "아티클",
    "뉴스레터",
    "노트",
    "읽을거리",
    "writings",
    "writing",
    "article",
    "newsletter",
    "note"
  ],
  open: [
    "열어",
    "보여줘",
    "이동",
    "어디서",
    "어디로",
    "어디",
    "open",
    "go to",
    "show me",
    "where"
  ]
};

export function includesAny(query: string, terms: string[]) {
  const normalized = normalizeNavigatorText(query);
  return terms.some((term) => normalized.includes(normalizeNavigatorText(term)));
}

export function detectLanguage(query: string): A1ChanDetectedLanguage {
  if (/[가-힣]/.test(query)) return "ko";
  if (/[\u3040-\u30ff]/.test(query)) return "ja";
  if (/[a-z]/i.test(query)) return "en";
  return "unknown";
}

export function detectIntent(query: string): A1ChanIntent {
  if (!query.trim()) return "empty";
  if (includesAny(query, intentTerms.capability)) return "capability";
  if (includesAny(query, intentTerms.detail)) return "detail";
  if (includesAny(query, intentTerms.currentPage)) return "currentPage";
  if (includesAny(query, intentTerms.person)) return "person";
  if (includesAny(query, intentTerms.contact)) return "contact";
  if (includesAny(query, intentTerms.projectCollection)) return "projectCollection";
  if (includesAny(query, intentTerms.writing)) return "writing";
  if (includesAny(query, intentTerms.open)) return "open";
  if (includesAny(query, intentTerms.smalltalk)) return "smalltalk";
  if (includesAny(query, intentTerms.confusion)) return "confusion";
  if (includesAny(query, intentTerms.siteQuestion)) return "siteQuestion";
  return "knowledgeQuestion";
}
