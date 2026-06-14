"use strict";

const IS_STATIC_A1_PREVIEW = window.location.pathname.includes("/a1trategize-preview/");

const localStorage = (() => {
  try {
    const storage = window.localStorage;
    const key = "__a1_preview_storage_probe__";
    storage.setItem(key, "1");
    storage.removeItem(key);
    return storage;
  } catch {
    const memory = new Map();
    return {
      getItem(key) {
        return memory.has(key) ? memory.get(key) : null;
      },
      setItem(key, value) {
        memory.set(key, String(value));
      },
      removeItem(key) {
        memory.delete(key);
      }
    };
  }
})();

const STATIC_DOMAIN_REGISTRY = [
  { key: "business", label: "Business Strategy", icon_id: "mode-business", description: "Market analysis, growth strategy, and executive brief generation." },
  { key: "career", label: "Career & Interview", icon_id: "mode-career", description: "Resume review, interview preparation, and career positioning." },
  { key: "ip", label: "IP & Patent", icon_id: "mode-ip", description: "Prior-art review, patent drafting, and IP strategy." },
  { key: "nnfc", label: "NNFC Recipe", icon_id: "mode-nnfc", description: "Semiconductor process validation against an equipment catalog." }
];

const STATIC_MODEL_CATALOG = {
  "solar-pro3": { display_name: "Solar Pro 3", provider: "upstage", supports_search: false },
  "sonar-pro": { display_name: "Sonar Pro", provider: "perplexity", supports_search: true },
  "gemini-2.5-pro": { display_name: "Gemini 2.5 Pro", provider: "google", supports_search: false },
  "deepseek-v4-pro": { display_name: "DeepSeek V4 Pro", provider: "alibaba", supports_search: false },
  "ax4-consult": { display_name: "A.X Consult", provider: "skt", supports_search: false }
};

const STATIC_MODEL_ASSIGNMENTS = {
  classification: "solar-pro3",
  query_expansion: "solar-pro3",
  research: "sonar-pro",
  supplementary_research: "sonar-pro",
  review: "deepseek-v4-pro",
  qa: "deepseek-v4-pro",
  draft: "gemini-2.5-pro",
  revision: "gemini-2.5-pro",
  critic: "deepseek-v4-pro",
  presentation: "ax4-consult"
};

const STATIC_EQUIPMENT = [
  {
    eqpmnt_id: 101,
    equipment_name: "PECVD Oxide Demo Tool",
    basic_info: {},
    structured_specs: {
      equipment_category: "Deposition",
      supported_wafer_size: ["4 inch", "6 inch"],
      target_materials: ["SiO2", "SiN"],
      max_temperature_celsius: 400,
      critical_constraints: "Static portfolio preview data."
    }
  },
  {
    eqpmnt_id: 202,
    equipment_name: "Mask Aligner Demo Tool",
    basic_info: {},
    structured_specs: {
      equipment_category: "Lithography",
      supported_wafer_size: ["4 inch"],
      target_materials: ["Photoresist"],
      max_temperature_celsius: 120,
      critical_constraints: "Static portfolio preview data."
    }
  }
];

const BASE_STEPS = [
  { key: "mode_selected", label: "Team Setup", num: 1 },
  { key: "query_expanded", label: "Prompt", num: 2 },
  { key: "initial_research_complete", label: "Research", num: 3 },
  { key: "review_complete", label: "Review", num: 4 },
  { key: "adequacy_scored", label: "Adaptive", num: 5 },
  { key: "draft_complete", label: "Draft", num: 6 },
  { key: "self_critique_complete", label: "Critic", num: 7 },
  { key: "qa_complete", label: "QA Review", num: 8 },
  { key: "final_validation_complete", label: "Validation", num: 9 },
  { key: "pipeline_complete", label: "Complete", num: 10 },
];

const SOFT_BREAK_TOKEN = "\uE000BR\uE000";

function getTrackerSteps() {
  return BASE_STEPS;
}

const ROLE_GROUPS = {
  "Research": { icon: "research", roles: ["research", "supplementary_research"] },
  "Review": { icon: "review", roles: ["review", "qa"] },
  "Drafting": { icon: "draft", roles: ["draft", "revision", "critic"] },
  "Auxiliary": { icon: "auxiliary", roles: ["classification", "query_expansion", "presentation"] },
};

const ICONS = {
  "mode-nnfc": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4h4"></path><path d="M12 4v6"></path>
      <path d="M9.5 10 6.5 19h11l-3-9"></path>
      <path d="M8.8 16h6.4"></path>
    </svg>`,
  "database": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7.5c0-1.4 2.2-2.5 5-2.5s5 1.1 5 2.5-2.2 2.5-5 2.5-5-1.1-5-2.5z"></path>
      <path d="M7 7.5v6.8c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7.5"></path>
      <path d="M7 11c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5"></path>
    </svg>`,
  "mode-business": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"></path>
      <path d="M5 8h14v10H5z"></path>
      <path d="M5 12h14"></path><path d="M11 12v1.5h2V12"></path>
    </svg>`,
  "mode-career": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h7l3 3v13H7z"></path><path d="M14 4v4h4"></path>
      <path d="M9.5 12h5"></path><path d="M9.5 15h4"></path>
    </svg>`,
  "mode-ip": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18h6"></path><path d="M10 21h4"></path>
      <path d="M8.5 13.6a5.5 5.5 0 1 1 7 0c-.8.6-1.1 1.4-1.1 2.4H9.6c0-1-.3-1.8-1.1-2.4z"></path>
    </svg>`,
  "theme-a1": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.2 15.8A7.6 7.6 0 0 1 8.2 5.8 7.7 7.7 0 1 0 18.2 15.8z"></path>
    </svg>`,
  "send": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
    </svg>`,
  "menu": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>
    </svg>`,
  "research": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4v5.2l-4.8 8.3A1.7 1.7 0 0 0 6.7 20h10.6a1.7 1.7 0 0 0 1.5-2.5L14 9.2V4"></path>
      <path d="M8.2 14h7.6"></path><path d="M9 4h6"></path>
    </svg>`,
  "review": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5 9.2 17 19 7"></path><path d="M4.5 5h15v14h-15z"></path>
    </svg>`,
  "draft": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19h4l10-10-4-4L5 15z"></path><path d="m13.8 6.2 4 4"></path>
    </svg>`,
  "auxiliary": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z"></path>
      <path d="M12 3.8v2"></path><path d="M12 18.2v2"></path><path d="M4.9 6.1l1.4 1.4"></path>
      <path d="m17.7 16.5 1.4 1.4"></path><path d="M3.8 12h2"></path><path d="M18.2 12h2"></path>
      <path d="m4.9 17.9 1.4-1.4"></path><path d="m17.7 7.5 1.4-1.4"></path>
    </svg>`,
  "team": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M15.5 10.5a2.5 2.5 0 1 0 0-5"></path>
      <path d="M4.5 19a4.5 4.5 0 0 1 9 0"></path><path d="M14.5 15.2a4 4 0 0 1 5 3.8"></path>
    </svg>`,
  "expand": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14"></path><path d="M12 5v14"></path><path d="M7.5 7.5 16.5 16.5"></path><path d="M16.5 7.5 7.5 16.5"></path>
    </svg>`,
  "chart": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19V5"></path><path d="M5 19h14"></path><path d="M8.5 15v-3"></path><path d="M12 15V8"></path><path d="M15.5 15v-5"></path>
    </svg>`,
  "link": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.5 13.5 14.5 8.5"></path><path d="M10.5 7.5l.7-.7a4 4 0 0 1 5.7 5.7l-.7.7"></path>
      <path d="M13.5 16.5l-.7.7a4 4 0 0 1-5.7-5.7l.7-.7"></path>
    </svg>`,
  "quality": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.8 14.4 9l5.6.7-4.1 3.9 1 5.5-4.9-2.7-4.9 2.7 1-5.5L4 9.7 9.6 9z"></path>
    </svg>`,
  "save": `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h12l2 2v12H5z"></path><path d="M8 5v5h7V5"></path><path d="M8 16h8"></path>
    </svg>`,
  "provider-perplexity": `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square">
      <path d="M12 2v20"></path>
      <path d="M12 12 5 6.5v11z"></path>
      <path d="M12 12l7-5.5v11z"></path>
      <path d="M5 9.5V4h4.5"></path>
      <path d="M19 9.5V4h-4.5"></path>
      <path d="M5 14.5V20h4.5"></path>
      <path d="M19 14.5V20h-4.5"></path>
    </svg>`,
  "provider-google": `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"></path>
    </svg>`,
  "provider-upstage": `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 1.4h5v1.2l-1 1v1.2l-1 1v1.2l-1 1v1.2l-1 1v1.2l-1 1v1.2l1 1v1.2l1 1v1.2l-9 1v1.2l-1 1v1.2h-8v-1.2l1-1v-1.2l1-1v-1.2l1-1v-1.2l1-1v-1.2l-1-1v-1.2l-1-1v-1.2l10-1v-1.2l2-1v-1.2l2-1z"></path>
    </svg>`,
  "provider-skt": `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M 3 5.5 h 18 v 4.5 h -6.5 v 10 h -5 v -10 h -6.5 z"></path>
    </svg>`,
  "provider-alibaba": `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12a8 8 0 018-8v8H4z"></path>
      <path d="M12 4a8 8 0 018 8h-8V4z"></path>
      <path d="M20 12a8 8 0 01-8 8v-8h8z"></path>
    </svg>`,
};

const DOMAIN_ICON_MAP = {
  nnfc: "mode-nnfc",
  business: "mode-business",
  career: "mode-career",
  ip: "mode-ip",
};

const PROVIDER_ICON_MAP = {
  perplexity: "provider-perplexity",
  google: "provider-google",
  upstage: "provider-upstage",
  skt: "provider-skt",
  alibaba: "provider-alibaba",
};

function iconSvg(name, className = "ui-icon") {
  const svg = ICONS[name] || ICONS["mode-business"];
  const classes = className === "ui-icon" ? "ui-icon" : `ui-icon ${className}`;
  return svg.replace("<svg", `<svg class="${classes}"`);
}

const EQUIPMENT_PAGE_SIZE = 24;

let currentJobId = null;
let activeEventSource = null;
let selectedDomain = "nnfc";
let domainRegistry = [];
let savedSessions = [];
let followEnabled = true;
let userPausedFollow = false;
let followScrollFrame = null;
const FOLLOW_THRESHOLD_PX = 180;
let equipmentData = [];
let equipmentCategories = [];
let equipActiveCat = "All";
let equipBrowserOpen = false;
let currentModalEquipId = null;
let pipelineStatusOverride = null;
let equipSearchDebounce = null;
let equipVisibleCount = EQUIPMENT_PAGE_SIZE;
let activePromptSuggestions = [];
let modalReturnFocusEl = null;

function setVisible(el, visible) {
  if (!el) return;
  if (visible) {
    el.classList.remove("is-hidden");
    el.removeAttribute("hidden");
  } else {
    el.classList.add("is-hidden");
    el.setAttribute("hidden", "");
  }
}

const DOMAIN_THEME_MAP = { business: "mckinsey", career: "mckinsey", ip: "mckinsey", nnfc: "nnfc" };
const MODE_SHORT_LABELS = {
  business: "Biz",
  career: "Career",
  ip: "Patent",
  nnfc: "NNFC",
};
const SUBMIT_ICON_SVG = iconSvg("send", "submit-svg");

function domainLogoSrc(key) {
  return key === "nnfc" ? "/a1trategize-preview/NNFC.png" : "/a1trategize-preview/A1Firm.png";
}

function domainLogoAlt(key) {
  return key === "nnfc" ? "NNFC" : "A1 Firm";
}

function domainLogoHtml(key, className = "mode-logo-img") {
  return `<img class="${escapeHtml(className)}" src="${domainLogoSrc(key)}" alt="${escapeHtml(domainLogoAlt(key))}" />`;
}

const DOMAIN_PROMPTS = {
  nnfc: `만들고 싶은 소자·박막·공정을 편하게 적어 주세요. 논문·수치가 없으면 없는 값은 확인 필요로 표시됩니다.

e.g., '실리콘 웨이퍼 위에 약 200nm SiO2 캡을 씌우고 싶습니다. NNFC 장비 DB 기준으로 가능한 공정 흐름, 후보 장비, 엔지니어 확인 항목을 검토용 초안으로 정리해주세요.'`,
  business: `비즈니스 전략을 분석하려는 주제나 질문을 입력해주세요.\n\ne.g., '최근 AI 챗봇 시장의 성장 추세와 주요 경쟁사(ChatGPT, Gemini, Claude)의 전략을 분석해주세요. 한국 시장 진출 시의 기회와 위협 요소, 그리고 성공 전략을 MBB 레벨의 관점에서 제시해주세요. TAM, 경쟁사 포지셔닝, 수익화 전략까지 포함해서요.'`,
  ip: `특허 명세서를 작성하려는 발명을 설명해주세요.\n\ne.g., '스마트폰 배터리 온도 관리 시스템: 배터리 온도를 실시간으로 모니터링하고 과열 시 자동으로 충전 속도를 조절하는 IoT 기반 시스템입니다. 센서 데이터 수집, 클라우드 분석, 앱 제어까지 포함됩니다. KIPO 표준의 완벽한 특허 명세서(발명의 명칭, 청구항, 상세 설명), 선행기술 조사, 침해 분석을 제공해주세요.'`,
  career: `커리어 컨설팅을 받으려는 직무나 경력을 설명해주세요.\n\ne.g., '5년 경력의 데이터 엔지니어입니다. Python, Spark, Kafka를 다루고 스타트업에서 근무 중입니다. Google 또는 아마존 시니어 엔지니어로 이직하려면 어떤 전략을 세워야 할까요? 기술 스택 강화, 포트폴리오 구성, 면접 준비, 연봉 협상 전략까지 글로벌 기준의 실행 로드맵을 제시해주세요.'`
};

const DOMAIN_SUGGESTIONS = {
  nnfc: [
    {
      label: "200nm SiO2 절연막",
      prompt: "실리콘 웨이퍼 위에 약 200nm SiO2 절연막을 형성하려고 합니다. NNFC 보유 장비 기준으로 가능한 공정 순서, 후보 장비, DB 근거, 엔지니어 확인이 필요한 hold point를 검토용 초안으로 정리해주세요."
    },
    {
      label: "Al 전극 패터닝",
      prompt: "Al 전극을 증착하고 패터닝해야 합니다. NNFC 장비 DB를 기준으로 증착, 리소그래피, 식각 또는 lift-off 중 적합한 플로우를 비교하고 추천 장비와 주의사항을 정리해주세요."
    },
    {
      label: "샘플 조건 기반 검토",
      prompt: "샘플 기판, 목표 박막 두께, 열 예산, 사용 가능 가스 조건을 입력하면 NNFC 장비 매칭, 공정 리스크, 엔지니어 확인 항목을 함께 검토하는 초안을 만들어주세요."
    }
  ],
  business: [
    { label: "시장 진입 전략", prompt: "신규 시장 진입 전략을 컨설팅 보고서 형태로 정리해주세요. 시장 크기, 고객 세그먼트, 경쟁 구도, 수익화 모델, 실행 로드맵을 포함해주세요." },
    { label: "경쟁사 포지셔닝", prompt: "주요 경쟁사들의 포지셔닝과 차별화 요소를 분석하고, 우리 제품이 취할 수 있는 전략적 선택지를 제시해주세요." },
    { label: "성장 로드맵", prompt: "현재 사업의 12개월 성장 로드맵을 제안해주세요. 우선순위, KPI, 리스크, 필요한 조직 역량을 포함해주세요." }
  ],
  ip: [
    { label: "특허 명세서 초안", prompt: "다음 발명 아이디어를 한국 특허 명세서 초안으로 정리해주세요. 발명의 명칭, 배경기술, 해결 과제, 구성, 효과, 청구항 방향을 포함해주세요." },
    { label: "선행기술 조사", prompt: "이 발명과 관련된 선행기술 조사 관점, 검색 키워드, 차별화 포인트, 회피 설계 가능성을 정리해주세요." },
    { label: "청구항 전략", prompt: "발명 아이디어를 기반으로 독립항과 종속항 전략을 제안하고, 넓은 권리범위와 방어 가능한 권리범위를 구분해주세요." }
  ],
  career: [
    { label: "이직 로드맵", prompt: "현재 경력과 목표 직무를 기준으로 6개월 이직 로드맵을 만들어주세요. 역량 갭, 포트폴리오, 네트워킹, 면접 준비를 포함해주세요." },
    { label: "이력서 개선", prompt: "아래 이력서 내용을 기반으로 임팩트 중심의 bullet과 포지셔닝 문구를 개선해주세요." },
    { label: "면접 전략", prompt: "목표 회사와 직무에 맞춰 예상 질문, 답변 구조, 사례 정리 방식, 보완해야 할 약점을 정리해주세요." }
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("a1_design") || "nnfc";
  selectedDomain = saved === "nnfc" ? "nnfc" : (localStorage.getItem("a1_domain") || "business");
  hydrateStaticIcons();
  
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === saved);
  });

  setupSidebarCollapse();
  setupAdvancedPanel();
  switchDesign(saved);
  setupAutoFollow();
  setupPromptInputBehavior();
  setupGlobalShortcuts();
  loadModels();
  loadDomains();
  loadSessions();

  updatePromptPlaceholder();
});

function setupAdvancedPanel() {
  const details = document.getElementById("sidebar-advanced");
  if (!details) return;
  details.open = localStorage.getItem("a1_models_panel_open") === "true";
  if (!localStorage.getItem("a1_models_panel_open")) details.open = false;
  details.addEventListener("toggle", () => {
    localStorage.setItem("a1_models_panel_open", details.open ? "true" : "false");
  });
}

function hydrateStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach(el => {
    const iconName = el.getAttribute("data-icon");
    if (iconName) el.innerHTML = iconSvg(iconName);
  });
}

function setupGlobalShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (isEquipModalOpen()) closeEquipModal();
    else if (equipBrowserOpen) closeEquipmentBrowser();
  });
}

window.toggleLivePanel = function(id) {
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.classList.toggle("collapsed");
  const btn = panel.querySelector(".panel-toggle");
  if (btn) btn.textContent = panel.classList.contains("collapsed") ? "펼치기" : "접기";
};

async function loadDomains() {
  if (IS_STATIC_A1_PREVIEW) {
    domainRegistry = STATIC_DOMAIN_REGISTRY;
    renderDomainControls(domainRegistry);
    return;
  }

  try {
    const res = await fetch("/api/domains");
    const data = await res.json();
    domainRegistry = data.domains || [];
    renderDomainControls(domainRegistry);
  } catch (e) {
      domainRegistry = [
        { key: "business", label: "Business Strategy", icon_id: "mode-business", description: "Strategic planning, market analysis, and growth strategies." },
        { key: "career", label: "Career & Interview", icon_id: "mode-career", description: "Resume review, career path coaching, and interview prep." },
        { key: "ip", label: "IP & Patent", icon_id: "mode-ip", description: "Patent drafting, prior art search, and IP strategy." },
        { key: "nnfc", label: "NNFC Recipe", icon_id: "mode-nnfc", description: "NNFC semiconductor process recipe validation against 183 tools." }
      ];
      renderDomainControls(domainRegistry);
    }
}

function renderDomainControls(domains) {
  renderModeDock(domains);
  syncModePresentation(domains.find(d => d.key === selectedDomain));
  switchDesign(document.documentElement.getAttribute("data-design") || "nnfc");
}

function renderModeDock(domains) {
  const dock = document.getElementById("prompt-mode-dock");
  if (!dock) return;
  dock.innerHTML = domains.map(d => {
    const iconName = d.icon_id || DOMAIN_ICON_MAP[d.key] || d.icon || "mode-business";
    const shortLabel = MODE_SHORT_LABELS[d.key] || d.label;
    const selected = d.key === selectedDomain;
    return `<button class="mode-mini-btn${selected ? " selected" : ""}" data-domain="${d.key}" type="button" onclick="selectDomain('${d.key}')" title="${escapeHtml(d.label)}" aria-label="${escapeHtml(d.label)}"${selected ? ' aria-current="true"' : ""}>
      <span class="mode-glyph" aria-hidden="true">${iconSvg(iconName)}</span>
      <span class="mode-mini-label">${escapeHtml(shortLabel)}</span>
    </button>`;
  }).join("");
}

function selectDomain(key) {
  if (key !== "nnfc") closeEquipmentBrowser();
  selectedDomain = key;
  localStorage.setItem("a1_domain", key);
  if (key !== "nnfc") localStorage.setItem("a1_last_firm_domain", key);
  updateModeSelectionUI();

  const theme = DOMAIN_THEME_MAP[key] || "mckinsey";
  switchDesign(theme);
  const triggerBtn = document.getElementById("equip-toggle-btn");
  const equipSection = document.getElementById("equip-browser-section");
  if (triggerBtn) triggerBtn.classList.toggle("is-hidden", key !== "nnfc");
  if (equipSection && key === "nnfc" && equipBrowserOpen) setVisible(equipSection, true);
  else if (equipSection && key !== "nnfc") setVisible(equipSection, false);
  if (key === "nnfc" && equipmentData.length === 0) loadEquipment();
  syncModePresentation(domainRegistry.find(d => d.key === key));

  updatePromptPlaceholder();
}

function updateModeSelectionUI() {
  document.querySelectorAll(".mode-mini-btn").forEach(btn => {
    const selected = btn.dataset.domain === selectedDomain;
    btn.classList.toggle("selected", selected);
    if (selected) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  });
}

function syncModePresentation(domain) {
  const resolved = domain || domainRegistry.find(d => d.key === selectedDomain);
  if (!resolved) return;

  const iconName = resolved.icon_id || DOMAIN_ICON_MAP[resolved.key] || resolved.icon || "mode-business";
  const brandMark = document.getElementById("brand-logo-mark");
  const ctx = document.getElementById("mode-context");
  const ctxIcon = document.getElementById("mode-context-icon");
  const ctxLabel = document.getElementById("mode-context-label");
  const ctxDesc = document.getElementById("mode-context-desc");

  if (brandMark) brandMark.innerHTML = domainLogoHtml(resolved.key, "brand-logo-img");
  if (ctxIcon) ctxIcon.innerHTML = iconSvg(iconName, "mode-context-svg");
  if (ctxLabel) ctxLabel.textContent = resolved.label;
  if (ctxDesc) ctxDesc.textContent = resolved.description || "";
  if (ctx) {
    ctx.dataset.domain = resolved.key;
    ctx.classList.remove("is-switching");
    void ctx.offsetWidth;
    ctx.classList.add("is-switching");
    window.setTimeout(() => ctx.classList.remove("is-switching"), 420);
  }
  document.documentElement.dataset.domain = resolved.key;
}

function updateHeroCopy() {
  const title = document.getElementById("hero-title");
  const subtitle = document.getElementById("hero-subtitle");
  if (!title || !subtitle) return;

  if (selectedDomain === "nnfc") {
    title.textContent = "A1trategize at NNFC";
    subtitle.textContent = "Service requester baseline recipe draft — final confirmation by NNFC engineers";
  } else {
    title.textContent = "A1trategize: A1 Firm";
    subtitle.textContent = "Business, career, and patent strategy delivered by AI";
  }
}

function updatePromptPlaceholder() {
  const textarea = document.getElementById("topic-input");
  if (!textarea) return;

  const currentDesign = document.documentElement.getAttribute("data-design") || "nnfc";
  let domainKey = currentDesign === "nnfc" ? "nnfc" : selectedDomain;

  if (DOMAIN_PROMPTS[domainKey]) {
    textarea.placeholder = DOMAIN_PROMPTS[domainKey];
  }
  renderPromptSuggestions(domainKey);
  updatePromptAccessoryVisibility();
}

function renderPromptSuggestions(domainKey) {
  const container = document.getElementById("prompt-suggestions");
  if (!container) return;
  activePromptSuggestions = DOMAIN_SUGGESTIONS[domainKey] || [];
  container.innerHTML = activePromptSuggestions.map((item, index) => `
    <button class="prompt-suggestion-btn" type="button" onclick="applyPromptSuggestion(${index})">
      <span>${escapeHtml(item.label)}</span>
    </button>
  `).join("");
}

function applyPromptSuggestion(index) {
  const item = activePromptSuggestions[index];
  const textarea = document.getElementById("topic-input");
  if (!item || !textarea) return;
  textarea.value = item.prompt;
  updatePromptAccessoryVisibility();
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function switchThemeUI(theme) {
  switchDesign(theme);
}

function switchDesign(theme) {
  document.documentElement.setAttribute("data-design", theme);
  localStorage.setItem("a1_design", theme);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  if (theme === "nnfc") { 
    selectedDomain = "nnfc"; 
    localStorage.setItem("a1_domain", "nnfc"); 
  } else {
    closeEquipmentBrowser();
    if (selectedDomain === "nnfc") {
      selectedDomain = localStorage.getItem("a1_last_firm_domain") || "business";
    }
    localStorage.setItem("a1_domain", selectedDomain);
    localStorage.setItem("a1_last_firm_domain", selectedDomain);
  }

  const triggerBtn = document.getElementById("equip-toggle-btn");
  const equipSection = document.getElementById("equip-browser-section");
  if (triggerBtn) triggerBtn.classList.toggle("is-hidden", theme !== "nnfc");
  if (equipSection) setVisible(equipSection, theme === "nnfc" && equipBrowserOpen);
  if (theme === "nnfc" && equipmentData.length === 0) loadEquipment();

  updateModeSelectionUI();
  if (domainRegistry.length) {
    syncModePresentation(domainRegistry.find(d => d.key === selectedDomain));
  }

  updateHeroCopy();
  updatePromptPlaceholder();
}

function setupSidebarCollapse() { 
  const lockup = document.getElementById("brand-lockup");
  if (lockup && !lockup.dataset.sidebarBound) {
    lockup.dataset.sidebarBound = "true";
    const expandIfCollapsed = () => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar?.classList.contains("collapsed")) setSidebarCollapsed(false);
    };
    lockup.addEventListener("click", expandIfCollapsed);
    lockup.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        expandIfCollapsed();
      }
    });
  }
  const saved = localStorage.getItem("a1_sidebar_collapsed");
  setSidebarCollapsed(saved === null ? false : saved === "true");
}

function setSidebarCollapsed(collapsed) {
  const sidebar = document.getElementById("sidebar");
  const layout = document.querySelector(".app-layout");
  const btn = document.getElementById("sidebar-toggle");
  const lockup = document.getElementById("brand-lockup");
  if (sidebar) sidebar.classList.toggle("collapsed", collapsed);
  if (layout) layout.classList.toggle("sidebar-collapsed", collapsed);
  if (btn) {
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.title = collapsed ? "사이드바 펼치기" : "사이드바 접기";
    btn.setAttribute("aria-label", collapsed ? "사이드바 펼치기" : "사이드바 접기");
  }
  if (lockup) {
    lockup.title = collapsed ? "사이드바 펼치기" : "A1trategize";
    lockup.setAttribute("aria-label", collapsed ? "사이드바 펼치기" : "A1trategize");
  }
  localStorage.setItem("a1_sidebar_collapsed", collapsed ? "true" : "false");
}
function toggleSidebar() { const sidebar = document.getElementById("sidebar"); setSidebarCollapsed(!sidebar?.classList.contains("collapsed")); }
window.toggleSidebar = toggleSidebar;
window.switchThemeUI = switchThemeUI;
window.startPipeline = startPipeline;
window.toggleEquipBrowser = toggleEquipBrowser;
window.selectDomain = selectDomain;
window.filterEquipment = filterEquipment;
window.closeEquipModal = closeEquipModal;
window.requestAIGuide = requestAIGuide;
window.applyPromptSuggestion = applyPromptSuggestion;
window.showMoreEquipment = showMoreEquipment;

function setupAutoFollow() {
  const toggle = document.getElementById("auto-follow-toggle");
  if (toggle) { toggle.checked = true; toggle.addEventListener("change", () => { followEnabled = toggle.checked; userPausedFollow = false; if (followEnabled) scheduleFollowScroll(true); }); }
  window.addEventListener("scroll", () => { if (!followEnabled) return; userPausedFollow = !isNearPageBottom(); }, { passive: true });
}
function scheduleFollowScroll(force = false) {
  if (!force && (!followEnabled || userPausedFollow)) return;
  if (followScrollFrame) return;
  followScrollFrame = window.requestAnimationFrame(() => {
    followScrollFrame = null;
    if (!force && (!followEnabled || userPausedFollow)) return;
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  });
}
function isNearPageBottom() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const viewport = window.innerHeight || document.documentElement.clientHeight;
  const fullHeight = document.documentElement.scrollHeight;
  return fullHeight - (scrollTop + viewport) < FOLLOW_THRESHOLD_PX;
}

async function loadModels() {
  if (IS_STATIC_A1_PREVIEW) {
    renderModelConfig(STATIC_MODEL_CATALOG, STATIC_MODEL_ASSIGNMENTS);
    return;
  }

  const container = document.getElementById("model-config");
  if (container) {
    container.innerHTML = `<div class="sidebar-note">모델 목록을 불러오는 중입니다.</div>`;
  }
  try {
    const res = await fetch("/api/models");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderModelConfig(data.catalog, data.assignments);
  } catch (e) {
    console.error("Failed to load models:", e);
    if (container) {
      container.innerHTML = `<div class="sidebar-note">서버 연결 후 모델 목록이 표시됩니다.</div>`;
    }
  }
}
function renderModelConfig(catalog, assignments) {
  const container = document.getElementById("model-config");
  if (!container) return;
  container.innerHTML = "";
  if (!catalog || !Object.keys(catalog).length) {
    container.innerHTML = `<div class="sidebar-note">사용 가능한 모델 목록이 없습니다.</div>`;
    return;
  }
  assignments = assignments || {};
  for (const [groupName, group] of Object.entries(ROLE_GROUPS)) {
    const div = document.createElement("div"); div.className = "model-group";
    div.innerHTML = `<button class="model-group-header" type="button" onclick="this.parentElement.classList.toggle('open')"><span class="model-group-title">${iconSvg(group.icon, "group-icon")} ${escapeHtml(groupName)}</span><span class="model-group-chevron" aria-hidden="true"></span></button><div class="model-group-body" id="group-${groupName}"></div>`;
    container.appendChild(div);
    const body = div.querySelector(".model-group-body");
    for (const role of group.roles) {
      const current = assignments[role] || "";
      const candidates = Object.keys(catalog).filter(key => { if (new Set(["research", "supplementary_research"]).has(role) && !catalog[key].supports_search) return false; return true; });
      const row = document.createElement("div"); row.className = "model-role-row";
      const roleLabel = role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const currentProvider = catalog[current]?.provider || catalog[candidates[0]]?.provider || "";
      row.innerHTML = `<label>${escapeHtml(roleLabel)}</label><div class="model-select-row"><span class="provider-badge" data-provider="${escapeHtml(currentProvider)}">${providerBadge(currentProvider)}</span><select onchange="assignModel('${role}', this.value); updateModelProviderBadge(this)">${candidates.map(k => `<option value="${escapeHtml(k)}" data-provider="${escapeHtml(catalog[k].provider)}" ${k === current ? "selected" : ""}>${escapeHtml(catalog[k].display_name)}</option>`).join("")}</select></div>`;
      body.appendChild(row);
    }
  }
}
async function assignModel(role, modelKey) { if (IS_STATIC_A1_PREVIEW) return; try { await fetch("/api/models/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, model_key: modelKey }) }); } catch (e) { console.error("Failed to assign model:", e); } }

function providerBadge(provider) {
  const iconName = PROVIDER_ICON_MAP[provider] || "auxiliary";
  const label = provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "Model";
  return `${iconSvg(iconName, "provider-icon")}<span>${escapeHtml(label)}</span>`;
}

function updateModelProviderBadge(selectEl) {
  const row = selectEl.closest(".model-select-row");
  const badge = row?.querySelector(".provider-badge");
  const provider = selectEl.selectedOptions[0]?.dataset.provider || "";
  if (badge) {
    badge.dataset.provider = provider;
    badge.innerHTML = providerBadge(provider);
  }
}

function setupPromptInputBehavior() {
  const textarea = document.getElementById("topic-input");
  if (!textarea) return;
  textarea.addEventListener("input", updatePromptAccessoryVisibility);
  textarea.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    const submitBtn = document.getElementById("submit-btn");
    if (!submitBtn?.disabled) startPipeline();
  });
  updatePromptAccessoryVisibility();
}

function updatePromptAccessoryVisibility() {
  const textarea = document.getElementById("topic-input");
  const inputCard = textarea?.closest(".input-card");
  const suggestions = document.getElementById("prompt-suggestions");
  const hasPrompt = Boolean(textarea?.value.trim());
  if (inputCard) inputCard.classList.toggle("has-prompt-text", hasPrompt);
  if (suggestions) suggestions.classList.toggle("is-hidden", hasPrompt || activePromptSuggestions.length === 0);
  if (hasPrompt && equipBrowserOpen) closeEquipmentBrowser();
}

function closeEquipmentBrowser() {
  equipBrowserOpen = false;
  const browser = document.getElementById("equip-browser");
  const equipSection = document.getElementById("equip-browser-section");
  const mainContent = document.getElementById("main-content");
  const toggleBtn = document.getElementById("equip-toggle-btn");
  setVisible(browser, false);
  setVisible(equipSection, false);
  if (mainContent) mainContent.classList.remove("catalog-active");
  if (toggleBtn) {
    toggleBtn.classList.remove("active");
    toggleBtn.title = "NNFC 장비 카탈로그 열기";
  }
}

function setPipelineUiActive(active) {
  const mainContent = document.querySelector(".main-content");
  const layout = document.querySelector(".app-layout");
  mainContent?.classList.toggle("pipeline-active", active);
  layout?.classList.toggle("pipeline-running", active);
}

async function loadSessions() {
  if (IS_STATIC_A1_PREVIEW) {
    savedSessions = [];
    renderSessionHistory(savedSessions);
    return;
  }

  try {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    savedSessions = data.sessions || [];
    renderSessionHistory(savedSessions);
  } catch (e) {
    console.error("Failed to load sessions:", e);
  }
}

function renderSessionHistory(sessions) {
  const container = document.getElementById("session-history");
  if (!container) return;
  if (!Array.isArray(sessions) || sessions.length === 0) {
    container.innerHTML = '<div class="session-history-empty">저장된 세션이 없습니다.</div>';
    return;
  }
  container.innerHTML = sessions.map(session => {
    const active = session.id === currentJobId ? " active" : "";
    const domain = session.domain || "general";
    const status = session.status || "saved";
    const score = Number.isFinite(session.final_score) ? `Score ${session.final_score}` : status;
    return `
      <button class="session-history-item${active}" type="button" onclick="loadSavedSession('${escapeHtml(session.id)}')">
        <span class="session-history-title">${escapeHtml(session.title || session.topic || "Untitled session")}</span>
        <span class="session-history-meta">${escapeHtml(domain.toUpperCase())} · ${escapeHtml(score)} · ${escapeHtml(formatSessionTime(session.updated_at || session.created_at))}</span>
      </button>`;
  }).join("");
}

function formatSessionTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function loadSavedSession(sessionId) {
  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    const session = data.session;
    if (!session) return;
    currentJobId = session.id;
    if (session.domain) {
      selectedDomain = session.domain;
      localStorage.setItem("a1_domain", selectedDomain);
      switchDesign(DOMAIN_THEME_MAP[selectedDomain] || "mckinsey");
    }
    const topicInput = document.getElementById("topic-input");
    if (topicInput) topicInput.value = session.topic || "";
    updatePromptAccessoryVisibility();
    document.getElementById("event-log").innerHTML = "";
    document.getElementById("live-output").innerHTML = "";
    document.getElementById("main-content")?.classList.remove("results-active");
    setVisible(document.getElementById("tracker-container"), false);
    setVisible(document.getElementById("mobile-pipeline-tracker"), false);
    setVisible(document.getElementById("live-controls"), false);
    pipelineStatusOverride = null;
    if (session.result) {
      renderResults(session.result);
      if (shouldRenderHarnessTrace()) renderHarnessTrace(session.id, session.result);
    }
    setPipelineUiActive(false);
    renderSessionHistory(savedSessions);
  } catch (e) {
    addEventCard("error", "Session Load Failed", e.message || String(e), "save");
  }
}

function startNewConsultation(clearPrompt = true) {
  if (activeEventSource) {
    activeEventSource.close();
    activeEventSource = null;
  }
  currentJobId = null;
  const topicInput = document.getElementById("topic-input");
  if (topicInput && clearPrompt) topicInput.value = "";
  updatePromptAccessoryVisibility();
  document.getElementById("event-log").innerHTML = "";
  document.getElementById("live-output").innerHTML = "";
  setVisible(document.getElementById("results-section"), false);
  document.getElementById("results-section").innerHTML = "";
  document.getElementById("main-content")?.classList.remove("results-active");
  setVisible(document.getElementById("tracker-container"), false);
  setVisible(document.getElementById("mobile-pipeline-tracker"), false);
  setVisible(document.getElementById("live-controls"), false);
  pipelineStatusOverride = null;
  setPipelineUiActive(false);
  const btn = document.getElementById("submit-btn");
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = SUBMIT_ICON_SVG;
  }
  renderSessionHistory(savedSessions);
  document.getElementById("input-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => topicInput?.focus(), 250);
}
window.startNewConsultation = startNewConsultation;
window.loadSavedSession = loadSavedSession;

async function startPipeline() {
  const topic = document.getElementById("topic-input").value.trim();
  if (!topic) return;
  closeEquipmentBrowser();
  if (activeEventSource) {
    activeEventSource.close();
    activeEventSource = null;
  }

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="border-width:2px; border-color:#8C91A6; border-top-color:currentColor;"></div>';

  document.getElementById("event-log").innerHTML = "";
  document.getElementById("live-output").innerHTML = "";
  setVisible(document.getElementById("live-controls"), true);
  setVisible(document.getElementById("results-section"), false);
  document.getElementById("results-section").innerHTML = "";
  document.getElementById("main-content")?.classList.remove("results-active");
  pipelineStatusOverride = null;
  
  followEnabled = true;
  userPausedFollow = false;
  const followToggle = document.getElementById("auto-follow-toggle");
  if (followToggle) followToggle.checked = true;

  setSidebarCollapsed(true);
  setPipelineUiActive(true);

  renderTracker(-1);
  setVisible(document.getElementById("tracker-container"), true);

  try {
    const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, domain: selectedDomain }) });
    const data = await res.json();
    currentJobId = data.session_id || data.job_id;
    loadSessions();
    listenToEvents(data.job_id);
  } catch (e) { addEventCard("error", "Pipeline Error", `Failed to start: ${e.message}`); resetButton(); }
}

function listenToEvents(jobId) {
  const evtSource = new EventSource(`/api/stream/${jobId}`);
  activeEventSource = evtSource;
  let stepIndex = -1;
  const getDomainConfig = () => {
    const isNNFC = selectedDomain === "nnfc";
    return {
      isNNFC, initialTitle: isNNFC ? "NNFC DB 매칭 분석" : "Initial Research", initialAgent: isNNFC ? "DB ANALYTICS AGENT" : "RESEARCH AGENT", initialMsg: isNNFC ? "DB 분석 완료" : "Initial Research Complete",
      suppTitle: isNNFC ? "심층 DB 매칭 리포트" : "Supplementary Research", suppAgent: isNNFC ? "DB ANALYTICS AGENT" : "RESEARCH AGENT", suppMsg: isNNFC ? "심층 분석 완료" : "Supplementary Research Complete", finalTitle: isNNFC ? "Final Report After Equipment Reference Validation" : "Final Report After Link Validation"
    };
  };

  evtSource.addEventListener("mode_selected", (e) => { stepIndex = 0; pipelineStatusOverride = null; const d = JSON.parse(e.data); if (d.mode_key) { selectedDomain = d.mode_key; updateModeSelectionUI(); syncModePresentation(domainRegistry.find(item => item.key === selectedDomain)); } renderTracker(stepIndex); addEventCard("info", "팀 구성 완료", `모드: <strong>${escapeHtml(d.mode_name || selectedDomain)}</strong>`, "team"); });
  evtSource.addEventListener("query_expanded", (e) => { stepIndex = 1; renderTracker(stepIndex); const d = JSON.parse(e.data); addEventCard("info", "Prompt Expanded", d.changed ? "The request was expanded into a research brief." : "The original request was used as-is.", "expand"); addLivePanel({ id: "query-expanded", title: "Expanded Research Brief", agent: "PROMPT CONTROL", type: "info", content: d.content || `### Expanded Research Guidance\n${d.expanded_topic || ""}` }); });
  evtSource.addEventListener("initial_research_complete", (e) => { stepIndex = 2; renderTracker(stepIndex); const d = JSON.parse(e.data); const config = getDomainConfig(); addEventCard("success", config.initialMsg, `Collected ${d.length} characters of research data.`, "research"); addLivePanel({ id: "initial-research", title: config.initialTitle, agent: config.initialAgent, type: "success", content: d.content || "" }); });
  evtSource.addEventListener("review_complete", (e) => { stepIndex = 3; renderTracker(stepIndex); const d = JSON.parse(e.data); addEventCard("success", "Data Review Complete", "Research data verified and supplementary questions generated.", "review"); addLivePanel({ id: "data-review", title: "Data Review", agent: "REVIEW AGENT", type: "success", content: d.content || d.raw_review || "" }); });
  evtSource.addEventListener("adequacy_scored", (e) => { stepIndex = 4; pipelineStatusOverride = null; renderTracker(stepIndex); const d = JSON.parse(e.data); const adequate = d.is_adequate; if (!adequate) pipelineStatusOverride = { title: "보조 리서치 준비", detail: "데이터 보완을 위해 추가 조사를 시작합니다." }; addEventCard(adequate ? "success" : "warning", "데이터 적정성 평가", `점수 <strong>${d.score || 0}/100</strong> — ${adequate ? "충분한 데이터, 보조 리서치를 건너뜁니다." : "데이터 부족, 보조 리서치를 진행합니다."}`, "chart"); });
  evtSource.addEventListener("supplementary_research_complete", (e) => { stepIndex = 4; const d = JSON.parse(e.data); const config = getDomainConfig(); pipelineStatusOverride = { title: "보조 리서치 완료", detail: `${d.length || 0}자 추가 수집 · 초안 단계로 이동합니다.` }; renderTracker(stepIndex); addEventCard("success", config.suppMsg, `추가 ${d.length}자 수집.`, "research"); addLivePanel({ id: "supplementary-research", title: config.suppTitle, agent: config.suppAgent, type: "success", content: d.content || "", meta: d.research_brief ? `Research brief: ${d.research_brief}` : "" }); });
  evtSource.addEventListener("draft_complete", (e) => { stepIndex = 5; pipelineStatusOverride = null; renderTracker(stepIndex); const d = JSON.parse(e.data); const validationLog = combineValidationLogs(d.link_log, d.equipment_reference_log); const config = getDomainConfig(); addEventCard("success", "Draft Report Generated", config.isNNFC ? `Draft: ${d.draft_length} chars, ${validationLog.length} equipment references normalized.` : `Draft: ${d.draft_length} chars, ${d.link_checks} links verified.`, "draft"); addLivePanel({ id: "draft-report", title: "Draft Report", agent: "DRAFTING AGENT", type: "success", content: d.content || "", linkLog: validationLog }); });
  evtSource.addEventListener("self_critique_complete", (e) => { stepIndex = 6; renderTracker(stepIndex); const d = JSON.parse(e.data); addEventCard("success", "Self-Correction Complete", "Critic persona reviewed and refined the draft.", "quality"); if (d.critique) addLivePanel({ id: "self-critique", title: "Self-Critique", agent: "CRITIQUE PERSONA", type: "success", content: d.critique }); addLivePanel({ id: "self-corrected-draft", title: "Revised Draft After Self-Correction", agent: "DRAFTING AGENT", type: "success", content: d.content || "", linkLog: d.equipment_reference_log || [] }); });
  evtSource.addEventListener("qa_complete", (e) => { stepIndex = 7; renderTracker(stepIndex); const d = JSON.parse(e.data); const qaLabel = d.qa_passed === false ? "Checklist: needs review" : "Checklist: passed"; addEventCard("success", "QA Review Complete", `Score <strong>${d.final_score}/100</strong> · ${qaLabel} · ${d.iterations} iteration(s).`, "review"); addLivePanel({ id: "qa-adjusted-report", title: "QA-Adjusted Report", agent: "QA REVIEW AGENT", type: "success", content: d.content || "", meta: `Score ${d.final_score}/100 · ${qaLabel} · ${d.qa_blocking_count || 0} CRITICAL item(s).`, linkLog: d.equipment_reference_log || [] }); });
  evtSource.addEventListener("final_validation_complete", (e) => { stepIndex = 8; renderTracker(stepIndex); const d = JSON.parse(e.data); const validationLog = combineValidationLogs(d.link_log, d.equipment_reference_log); const config = getDomainConfig(); addEventCard("success", "Final Validation", config.isNNFC ? `${validationLog.length} NNFC equipment references checked.` : `${d.link_checks} links validated. Financial disclaimers: ${d.financial_disclaimer_ok ? "OK" : "Missing"}.`, "link"); addLivePanel({ id: "validated-final-report", title: config.finalTitle, agent: "VALIDATION MODULE", type: "success", content: d.content || "", linkLog: validationLog, meta: config.isNNFC ? "NNFC equipment references and QA constraints were checked against the local equipment DB." : `Financial disclaimers: ${d.financial_disclaimer_ok ? "OK" : "Missing"}.` }); });
  evtSource.addEventListener("presentation_data_generated", (e) => { addEventCard("info", "Presentation Data", "Presentation slide layout generated.", "chart"); });
  evtSource.addEventListener("documents_saved", (e) => { const d = JSON.parse(e.data); addEventCard("success", "Documents Saved", `DOCX: ${d.docx || "—"}<br>PDF: ${d.pdf || "—"}<br>PPTX: ${d.pptx || "—"}`, "save"); });
  evtSource.addEventListener("pipeline_complete", (e) => { stepIndex = 9; pipelineStatusOverride = null; renderTracker(stepIndex); evtSource.close(); activeEventSource = null; const d = JSON.parse(e.data || "{}"); if (d.session_id) currentJobId = d.session_id; fetchResults(jobId); });
  evtSource.addEventListener("pipeline_error", (e) => { const d = JSON.parse(e.data); addEventCard("error", "Pipeline Error", d.error); evtSource.close(); activeEventSource = null; loadSessions(); resetButton(); });
  evtSource.onerror = () => { evtSource.close(); activeEventSource = null; setTimeout(() => fetchResults(jobId), 1000); };
}

async function fetchResults(jobId) {
  try {
    const res = await fetch(`/api/result/${jobId}`);
    const data = await res.json();
    if (data.status === "complete" && data.result) {
      currentJobId = data.result.session_id || jobId;
      renderResults(data.result);
      if (shouldRenderHarnessTrace()) renderHarnessTrace(jobId, data.result);
      loadSessions();
    }
  } catch (e) {
    console.error("Failed to fetch results:", e);
  }
  resetButton();
}
function resetButton() {
  const btn = document.getElementById("submit-btn");
  btn.disabled = false;
  btn.innerHTML = SUBMIT_ICON_SVG;
  pipelineStatusOverride = null;
  setVisible(document.getElementById("live-controls"), false);
  setPipelineUiActive(false);
}

async function renderHarnessTrace(jobId, result = {}) {
  if (!shouldRenderHarnessTrace()) return;
  try {
    let trace = result?._harness_metadata || {};
    if (!trace.node_history || !trace.node_history.length) {
      const res = await fetch(`/api/harness/last-trace/${jobId}`);
      trace = await res.json();
    }
    const rows = trace.node_history || [];
    if (!rows.length) return;

    const card = document.querySelector("#results-section .results-card");
    if (!card) return;

    const existing = card.querySelector(".harness-trace");
    if (existing) existing.remove();

    const details = document.createElement("details");
    details.className = "harness-trace";
    const errorCount = (trace.errors || []).length;
    const safetyCount = (trace.safety_violations || []).length;
    details.innerHTML = `
      <summary>Harness execution trace (${rows.length} nodes, ${errorCount} error${errorCount === 1 ? "" : "s"}, ${safetyCount} safety violation${safetyCount === 1 ? "" : "s"})</summary>
      <div class="harness-trace-table-scroll">
        <table class="harness-trace-table">
          <thead><tr><th>Node</th><th>Status</th><th>Duration</th><th>Outputs</th><th>Error</th></tr></thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td>${escapeHtml(row.node_name || "")}</td>
                <td><span class="status-chip ${row.status === "error" ? "error" : row.status === "skipped" ? "running" : "success"}">${escapeHtml(row.status || "")}</span></td>
                <td>${escapeHtml(row.duration_seconds ?? "")}s</td>
                <td>${escapeHtml((row.output_keys || []).join(", "))}</td>
                <td>${escapeHtml(row.error || "")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
    card.appendChild(details);
  } catch (e) {
    console.error("Failed to render harness trace:", e);
  }
}

function shouldRenderHarnessTrace() {
  return localStorage.getItem("a1_debug_trace") === "true";
}

function buildSidebarTrackerHtml(activeIndex) {
  const steps = getTrackerSteps();
  let html = `<div class="pipeline-tracker">`;
  steps.forEach((step, i) => {
    let stepClass = "";
    if (i < activeIndex) stepClass = "done";
    else if (i === activeIndex) stepClass = "active";
    const numContent = i < activeIndex ? "&#10003;" : i + 1;
    html += `
      <div class="tracker-step ${stepClass}" title="${escapeHtml(step.label)}">
        <div class="step-num">${numContent}</div>
        <div class="step-label">${escapeHtml(step.label)}</div>
      </div>`;
    if (i < steps.length - 1) {
      html += `<div class="tracker-connector ${i < activeIndex ? "done" : ""}"></div>`;
    }
  });
  return `${html}</div>`;
}

function buildMobileTrackerHtml(activeIndex) {
  const steps = getTrackerSteps();
  const safeIndex = Math.max(-1, Math.min(activeIndex, steps.length - 1));
  const current = safeIndex >= 0 ? steps[safeIndex] : null;
  const override = pipelineStatusOverride;
  const label = override?.title || (current ? current.label : "준비 중");
  const dots = steps.map((step, i) => {
    const cls = i < safeIndex ? "done" : i === safeIndex ? "active" : "";
    return `<span class="mobile-tracker-dot ${cls}" title="${escapeHtml(step.label)}"></span>`;
  }).join("");
  return `
    <div class="mobile-tracker-inner">
      <div class="mobile-tracker-dots" role="list">${dots}</div>
      <div class="mobile-tracker-copy">
        <span class="mobile-tracker-step">${safeIndex >= 0 ? `${safeIndex + 1}/${steps.length}` : "—"}</span>
        <strong>${escapeHtml(label)}</strong>
      </div>
    </div>`;
}

function renderTracker(activeIndex) {
  const html = buildSidebarTrackerHtml(activeIndex);
  const container = document.getElementById("tracker-container");
  if (container) {
    container.innerHTML = html;
    setVisible(container, true);
  }
  const mobile = document.getElementById("mobile-pipeline-tracker");
  if (mobile) {
    mobile.innerHTML = buildMobileTrackerHtml(activeIndex);
    setVisible(mobile, true);
  }
  renderPipelineStatus(activeIndex);
}

function renderPipelineStatus(activeIndex) {
  const log = document.getElementById("event-log");
  if (!log) return;
  const steps = getTrackerSteps();
  const safeIndex = Math.max(-1, Math.min(activeIndex, steps.length - 1));
  const current = safeIndex >= 0 ? steps[safeIndex] : null;
  const complete = current?.key === "pipeline_complete";
  const progress = safeIndex < 0 ? 4 : Math.round(((safeIndex + 1) / steps.length) * 100);
  const override = pipelineStatusOverride;
  const title = override?.title
    || (complete ? "파이프라인 완료" : current ? `${current.label} 진행 중` : "파이프라인 준비 중");
  const detail = override?.detail
    || (complete
      ? "최종 산출물이 준비되었습니다."
      : current
        ? `${safeIndex + 1} / ${steps.length} 단계`
        : "에이전트 연결 및 하네스 초기화 중입니다.");

  let panel = document.getElementById("pipeline-status-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "pipeline-status-panel";
    panel.className = "pipeline-status-panel";
    log.prepend(panel);
  }
  panel.classList.toggle("complete", complete);
  panel.innerHTML = `
    <div class="pipeline-status-copy">
      <span class="pipeline-status-eyebrow">${complete ? "완료" : "진행 중"}</span>
      <strong>${escapeHtml(title)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
    <div class="pipeline-status-meter" aria-label="Pipeline progress">
      <span style="width:${progress}%"></span>
    </div>
    <div class="pipeline-status-steps">
      ${steps.map((step, i) => `<span class="${i < safeIndex ? "done" : i === safeIndex ? "active" : ""}" title="${escapeHtml(step.label)}"></span>`).join("")}
    </div>
  `;
}

function addEventCard(type, title, message, icon = "quality") {
  const log = document.getElementById("event-log");
  const chipClass = type === "error" ? "error" : type === "warning" ? "running" : "success";
  const card = document.createElement("div"); card.className = "agent-card";
  card.innerHTML = `<div class="agent-card-header"><div class="agent-icon">${iconSvg(icon)}</div><h4>${title}</h4><span class="status-chip ${chipClass}">${type.toUpperCase()}</span></div><div class="agent-card-body"><p>${message}</p></div>`;
  log.appendChild(card); scheduleFollowScroll();
}

function addLivePanel({ id, title, agent, type = "info", content = "", meta = "", linkLog = [] }) {
  const output = document.getElementById("live-output");
  if (!output) return;
  const bodyText = String(content || "");
  const hasLog = Array.isArray(linkLog) && linkLog.length > 0;
  if (!bodyText.trim() && !meta && !hasLog) { addEventCard("warning", "Empty Stage Payload", `${escapeHtml(title)} completed without content.`, "quality"); return; }

  document.querySelectorAll(".live-panel.active").forEach(panel => panel.classList.remove("active"));
  const existing = document.getElementById(id); if (existing) existing.remove();

  const chipClass = type === "error" ? "error" : type === "warning" ? "running" : "success";
  const panel = document.createElement("section"); panel.className = `live-panel ${type} active`; panel.id = id;
  panel.innerHTML = `<div class="live-panel-header"><div><div class="live-agent">${escapeHtml(agent)}</div><h3>${escapeHtml(title)}</h3></div><div class="live-panel-actions"><span class="status-chip ${chipClass}">${type.toUpperCase()}</span><button class="panel-toggle" type="button" onclick="window.toggleLivePanel('${id}')">접기</button></div></div><div class="live-panel-body">${meta ? `<div class="live-meta">${escapeHtml(meta)}</div>` : ""}<div class="stream-content" id="${id}-content"></div><div class="link-log-wrap">${renderLinkLogTable(linkLog)}</div></div>`;
  output.appendChild(panel);
  streamMarkdownInto(panel.querySelector(".stream-content"), bodyText);
  scheduleFollowScroll(true);
}

function streamMarkdownInto(target, text) {
  if (!target) return;
  const source = String(text || "");
  if (!source.trim()) { target.classList.add("complete"); return; }
  const chunkSize = source.length > 12000 ? 900 : source.length > 5000 ? 520 : 280;
  let index = 0;
  function drawNextChunk() {
    index = Math.min(source.length, index + chunkSize);
    target.innerHTML = simpleMarkdownToHtml(source.slice(0, index));
    scheduleFollowScroll();
    if (index < source.length) window.setTimeout(drawNextChunk, 18); else target.classList.add("complete");
  }
  drawNextChunk();
}

function renderLinkLogTable(linkLog) {
  if (!Array.isArray(linkLog) || linkLog.length === 0) return "";
  const isEquipmentLog = linkLog.some(row => row && (
    Object.prototype.hasOwnProperty.call(row, "equipment_id") ||
    Object.prototype.hasOwnProperty.call(row, "original_id") ||
    Object.prototype.hasOwnProperty.call(row, "expected_name") ||
    Object.prototype.hasOwnProperty.call(row, "observed_name")
  ));
  if (isEquipmentLog) {
    const rows = linkLog.map(row => {
      const id = row.equipment_id ? `ID ${row.equipment_id}` : row.original_id ? `ID ${row.original_id}` : "-";
      const expected = row.expected_name ? `DB: ${row.expected_name}` : "";
      const observed = row.observed_name ? `Text: ${row.observed_name}` : "";
      const equipment = [id, expected, observed].filter(Boolean).join("<br>");
      const issue = [row.reason, row.category].filter(Boolean).join(" · ") || row.message || "-";
      const action = row.action || row.status || "-";
      const status = row.status || "note";
      return `<tr>
        <td><span class="log-status">${escapeHtml(status)}</span></td>
        <td>${equipment}</td>
        <td>${escapeHtml(issue)}</td>
        <td>${escapeHtml(action)}</td>
      </tr>`;
    }).join("");
    return `<details class="link-log"><summary>DB validation notes (${linkLog.length})</summary><div class="link-log-table-scroll"><table class="link-log-table link-log-table-compact"><thead><tr><th>Status</th><th>Equipment</th><th>Issue</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }
  const preferred = ["status", "reason", "action", "url", "http_status_code", "equipment_id", "original_id", "observed_name", "expected_name", "category", "anchor_keywords", "matched_keywords", "match_ratio"];
  const seen = new Set(); const columns = [];
  for (const col of preferred) { if (linkLog.some(row => row && Object.prototype.hasOwnProperty.call(row, col))) { columns.push(col); seen.add(col); } }
  for (const row of linkLog) { Object.keys(row || {}).forEach(key => { if (!seen.has(key)) { columns.push(key); seen.add(key); } }); }
  const rows = linkLog.map(row => `<tr>${columns.map(col => `<td>${escapeHtml(formatLogValue(row[col]))}</td>`).join("")}</tr>`).join("");
  return `<details class="link-log"><summary>Validation log (${linkLog.length})</summary><div class="link-log-table-scroll"><table class="link-log-table"><thead><tr>${columns.map(col => `<th>${escapeHtml(col.replace(/_/g, " "))}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
function combineValidationLogs(...logs) { return logs.flatMap(log => Array.isArray(log) ? log : []); }
function formatLogValue(value) { if (Array.isArray(value)) return value.join(", "); if (value && typeof value === "object") return JSON.stringify(value); return value ?? ""; }

window.setViewMode = function(mode) {
    const isNnfcCard = Boolean(document.querySelector(".results-card-nnfc"));
    const views = isNnfcCard
      ? ["runsheet-view", "engineer-view", "document-view", "slide-view"]
      : ["summary-view", "process-view", "runsheet-view", "engineer-view", "document-view", "slide-view"];
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    document.querySelectorAll(".view-tab").forEach(btn => btn.classList.remove("active"));

    const viewMap = {
      summary: "summary-view",
      process: "process-view",
      runsheet: "runsheet-view",
      engineer: "engineer-view",
      document: "document-view",
      slide: "slide-view",
    };
    const targetId = viewMap[mode] || "document-view";
    const target = document.getElementById(targetId);
    if (target) target.classList.remove("hidden");

    const btnId = {
      summary: "btn-summary",
      process: "btn-process",
      runsheet: "btn-runsheet",
      engineer: "btn-engineer",
      document: "btn-doc",
      slide: "btn-slide",
    }[mode];
    const btn = btnId ? document.getElementById(btnId) : null;
    if (btn) btn.classList.add("active");
};

const NNFC_DEFAULT_DISCLAIMER =
  "본 문서는 AI가 제안하는 공정 레시피 초안으로, 나노종합기술원(NNFC)의 실제 장비 상태 및 제약 조건을 완벽히 반영하지 않을 수 있습니다. 실제 공정 진행 전, 반드시 담당 장비 엔지니어의 최종 검토 및 승인을 거치시기 바랍니다.";

function renderNnfcDisclaimerBanner(text) {
  const msg = normalizeMarkdownInput(text || NNFC_DEFAULT_DISCLAIMER);
  return `<div class="nnfc-disclaimer-banner" role="alert">
    <strong>중요 안내</strong>
    <p>${escapeHtml(msg).replaceAll(SOFT_BREAK_TOKEN, "<br>")}</p>
  </div>`;
}

function extractSectionMarkdown(md, headerPattern) {
  if (!md) return "";
  const match = md.match(headerPattern);
  if (!match || match.index === undefined) return "";
  const start = match.index + match[0].length;
  const rest = md.slice(start);
  const next = rest.search(/\n##\s+/);
  return (next >= 0 ? rest.slice(0, next) : rest).trim();
}

function extractProcessStepCards(summaryMd) {
  const cards = [];
  const tableMatch = summaryMd.match(/\|[^\n]+\|\n\|[-:\s|]+\|\n((?:\|[^\n]+\|\n?)+)/);
  if (tableMatch) {
    const rows = tableMatch[1].trim().split("\n").filter(r => r.includes("|"));
    rows.forEach((row, idx) => {
      const cells = row.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      if (cells.length >= 2) {
        cards.push({
          step: cells[0] || `Step ${idx + 1}`,
          equipment: cells[1] || "—",
          note: cells[2] || "",
        });
      }
    });
  }
  if (cards.length === 0) {
    const bullets = summaryMd.match(/^[-*]\s+(.+)$/gm);
    if (bullets) {
      bullets.slice(0, 6).forEach((b, idx) => {
        cards.push({ step: `Step ${idx + 1}`, equipment: "—", note: b.replace(/^[-*]\s+/, "") });
      });
    }
  }
  return cards;
}

function renderProcessStepCards(cards) {
  if (!cards.length) {
    return `<p class="empty-state">공정 단계 요약이 없습니다. Executive Summary를 확인하세요.</p>`;
  }
  return `<div class="nnfc-process-grid">${cards.map(c => `
    <article class="nnfc-process-card">
      <div class="nnfc-process-step">${inlineMarkdown(c.step)}</div>
      <div class="nnfc-process-equip">${inlineMarkdown(c.equipment)}</div>
      ${c.note ? `<p class="nnfc-process-note">${inlineMarkdown(c.note)}</p>` : ""}
    </article>`).join("")}</div>`;
}

function extractEquipmentIdsFromText(value) {
  const ids = new Set();
  String(value || "").replace(/\bID[:\s]*(\d+(?:\s*\/\s*\d+)*)\b|\[NNFC\s+DB:\s*(\d+(?:\s*,\s*\d+)*)\]|\(ID[:\s]*(\d+(?:\s*\/\s*\d+)*)\)/gi, (_, a, b, c) => {
    String(a || b || c || "").split(/[\/,]/).forEach(part => ids.add(Number(part.trim())));
    return "";
  });
  return [...ids].filter(Number.isFinite);
}

function buildDbMatchMap(dbMatches) {
  return new Map((dbMatches || [])
    .filter(item => item && item.equipment_id)
    .map(item => [Number(item.equipment_id), item]));
}

function formatDbEvidence(match) {
  if (!match) return "";
  const bits = [];
  if (match.asset_id) bits.push(`asset ${match.asset_id}`);
  const makerModel = [match.maker, match.model].filter(Boolean).join(" ");
  if (makerModel) bits.push(makerModel);
  if (match.category) bits.push(match.category);
  if (match.supported_wafer_size?.length) bits.push(`wafer ${match.supported_wafer_size.join(", ")}`);
  if (match.available_gases?.length) bits.push(`gas ${match.available_gases.slice(0, 5).join(", ")}`);
  if (match.max_temperature_celsius) bits.push(`max ${match.max_temperature_celsius}C`);
  if (match.target_materials?.length) bits.push(`target ${match.target_materials.slice(0, 4).join(", ")}`);
  if (/BOE|DHF|BHF|\bHF\b/i.test(match.capability_summary || "")) bits.push("wet chem BOE/DHF/HF noted");
  return bits.slice(0, 7).join(" | ");
}

function dbMatchText(match) {
  if (!match) return "";
  return [
    match.equipment_name,
    match.category,
    match.asset_id,
    match.maker,
    match.model,
    ...(match.supported_wafer_size || []),
    ...(match.available_gases || []),
    ...(match.target_materials || []),
    match.capability_summary,
  ].filter(Boolean).join(" ");
}

function dedupeValues(values) {
  const seen = new Set();
  return values.filter(value => {
    const key = String(value || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatRunSheetOwner(matches) {
  const owners = dedupeValues((matches || []).map(match => {
    if (!match) return "";
    return [match.owner_name, match.owner_phone ? `(${match.owner_phone})` : ""].filter(Boolean).join(" ");
  }));
  if (!owners.length) return "NNFC engineer confirmation";
  if (owners.length <= 2) return owners.join(" / ");
  return `${owners.slice(0, 2).join(" / ")} +${owners.length - 2}`;
}

function inferRunSheetHoldPoint(card, matches, note) {
  const combined = `${card.step || ""} ${card.equipment || ""} ${note || ""} ${(matches || []).map(dbMatchText).join(" ")}`;
  if (/wet|BOE|DHF|BHF|\bHF\b|chemical|bath|etch/i.test(combined)) return "Chemical bath/line check";
  if (/deposition|PECVD|TEOS|gas|plasma|NF3|O2|temperature|temp|°C|℃/i.test(combined)) return "Process setpoint confirmation";
  if (/measurement|inspection|SEM|FE-SEM|sample|stage|metrology/i.test(combined)) return "Sample fixture/measurement setup";
  if (/N\/A|confirm|confirmation|interlock|risk|safety|verify|validation|check/i.test(note || "")) return "Engineer confirmation";
  return matches && matches.length ? "DB match review" : "Engineer confirmation";
}

function buildNnfcRunSheetRows(processCards, reportText, equipLog, dbMatches = []) {
  const dbMatchMap = buildDbMatchMap(dbMatches);
  const sourceCards = Array.isArray(processCards) && processCards.length
    ? processCards
    : extractProcessStepCards(reportText || "");
  const rows = sourceCards.slice(0, 12).map((card, index) => {
    const note = String(card.note || "").trim();
    const needsHold = /N\/A|confirm|confirmation|interlock|risk|safety|verify|validation|check/i.test(note);
    const ids = extractEquipmentIdsFromText(`${card.step || ""} ${card.equipment || ""} ${card.note || ""}`);
    const matched = ids.map(id => dbMatchMap.get(id)).filter(Boolean);
    const canonicalEquipment = matched.length
      ? matched.map(item => `ID ${item.equipment_id} - ${item.equipment_name}`).join("; ")
      : (card.equipment || "TBD");
    const evidence = matched.map(formatDbEvidence).filter(Boolean).join(" / ");
    return {
      no: index + 1,
      step: card.step || `Step ${index + 1}`,
      equipment: canonicalEquipment,
      equipmentEvidence: evidence || "DB evidence not shown in current summary.",
      recipe: note || "Confirm baseline parameters with the responsible engineer.",
      hold: inferRunSheetHoldPoint(card, matched, note || (needsHold ? "confirm" : "")),
      owner: formatRunSheetOwner(matched),
    };
  });

  if (!rows.length && Array.isArray(equipLog)) {
    equipLog.slice(0, 8).forEach((item, index) => {
      rows.push({
        no: index + 1,
        step: item.category || item.status || `Check ${index + 1}`,
        equipment: item.observed_name || item.expected_name || item.equipment_id || "NNFC DB item",
        recipe: item.reason || item.message || item.action || "Review equipment constraint.",
        hold: inferRunSheetHoldPoint(item, [], item.reason || item.message || item.action),
        owner: "NNFC engineer confirmation",
      });
    });
  }
  return rows;
}

function renderNnfcRunSheet(processCards, reportText, equipLog, dbMatches = []) {
  const rows = buildNnfcRunSheetRows(processCards, reportText, equipLog, dbMatches);
  if (!rows.length) {
    return `<p class="empty-state">Run sheet review draft is not available. Check the Engineer Detail tab for the validation log.</p>`;
  }
  window._lastRunSheetRows = rows;
  return `
    <div class="runsheet-panel">
      <div class="runsheet-header">
        <div>
          <div class="results-kicker">NNFC operations review draft</div>
          <h3>Run Sheet Review Draft</h3>
        </div>
        <div class="runsheet-actions">
          <button class="result-action-btn" type="button" onclick="window.downloadRunSheetCSV()" title="Export CSV">CSV</button>
          <button class="result-action-btn primary" type="button" onclick="window.downloadRunSheetXLSX()" title="Export Excel">XLSX</button>
          <span class="status-chip warning">Engineer approval required</span>
        </div>
      </div>
      <div class="runsheet-table-wrap">
        <table class="runsheet-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Process Step</th>
              <th>Equipment / Tool</th>
              <th>Baseline Review Item / Parameter</th>
              <th>Hold Point</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td>${escapeHtml(row.no)}</td>
                <td>${inlineMarkdown(row.step)}</td>
                <td>${inlineMarkdown(row.equipment)}<span class="runsheet-cell-note">${escapeHtml(row.equipmentEvidence)}</span></td>
                <td>${inlineMarkdown(row.recipe)}</td>
                <td>${escapeHtml(row.hold)}</td>
                <td>${escapeHtml(row.owner)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

window.downloadRunSheetCSV = function() {
  const rows = window._lastRunSheetRows;
  if (!rows || !rows.length) return;
  const header = ["No", "Process Step", "Equipment / Tool", "Baseline Review Item / Parameter", "Hold Point", "Owner"];
  const csvRows = [header.join(",")];
  rows.forEach(row => {
    csvRows.push([
      row.no,
      csvEscape(stripHtml(row.step)),
      csvEscape(stripHtml(row.equipmentEvidence ? `${row.equipment} (${row.equipmentEvidence})` : row.equipment)),
      csvEscape(stripHtml(row.recipe)),
      csvEscape(row.hold),
      csvEscape(row.owner)
    ].join(","));
  });
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `NNFC_RunSheet_${dateStamp()}.csv`);
};

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\r\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}
function stripHtml(str) {
  const tmp = document.createElement("div");
  tmp.innerHTML = String(str ?? "");
  return tmp.textContent || tmp.innerText || "";
}

window.downloadRunSheetXLSX = function() {
  return window.exportReportFile("xlsx");
};

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function isNnfcResult(result) {
  return result.mode_key === "nnfc" || selectedDomain === "nnfc" ||
    (result.mode_name && String(result.mode_name).includes("NNFC"));
}

function qaStatusChip(result) {
  const score = escapeHtml(result.final_score ?? "-");
  if (result.qa_passed === false) {
    const n = (result.qa_blocking_failures || []).length;
    return `<span class="status-chip warning" title="QA checklist not fully passed">Score: ${score}/100 · Review ${n || "?"} item(s)</span>`;
  }
  return `<span class="status-chip success">Score: ${score}/100 · QA passed</span>`;
}

function renderNnfcNextActions(processCards, equipLog, dbMatches) {
  const stepCount = processCards.length || 0;
  const referenceCount = dbMatches.length || equipLog.length || 0;
  return `
    <div class="nnfc-next-actions" aria-label="다음 확인 항목">
      <div class="nnfc-next-action">
        <span class="nnfc-next-label">Equipment DB</span>
        <strong>${referenceCount ? `${referenceCount}건 매칭 확인` : "매칭 근거 확인"}</strong>
      </div>
      <div class="nnfc-next-action">
        <span class="nnfc-next-label">Run Sheet Review</span>
        <strong>${stepCount ? `${stepCount}단계 검토` : "공정 단계 검토"}</strong>
      </div>
      <div class="nnfc-next-action">
        <span class="nnfc-next-label">Approval</span>
        <strong>담당 엔지니어 최종 승인</strong>
      </div>
    </div>`;
}

function normalizeMarkdownInput(value) {
  return stripInternalReasoningBlocks(value)
    .replace(/\r\n/g, "\n")
    .replace(/&amp;nbsp;|&nbsp;/gi, " ")
    .replace(/(?:&amp;lt;|&lt;|<)\s*br\s*\/?\s*(?:&amp;gt;|&gt;|>)/gi, SOFT_BREAK_TOKEN)
    .replace(/\\n/g, "\n");
}

function stripInternalReasoningBlocks(value) {
  return String(value || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<details\b[\s\S]*?<\/details>/gi, "")
    .replace(/```(?:thinking|reasoning|cot)[\s\S]*?```/gi, "");
}

function stripNnfcDisclaimerFromMarkdown(value) {
  return normalizeMarkdownInput(value)
    .replace(/\n?\s*---\s*\n+\s*##\s+Disclaimer\s*\n+[\s\S]*$/i, "")
    .trim();
}

function renderResults(result) {
  try {
      setVisible(document.getElementById("tracker-container"), false);
      setVisible(document.getElementById("mobile-pipeline-tracker"), false);

      const section = document.getElementById("results-section");
      if (!section) return;
      setVisible(section, true);
      section.classList.remove("hidden"); 
      document.getElementById("main-content")?.classList.add("results-active");

      window._lastResultPayload = result;
      const scoreChip = qaStatusChip(result);
      const nnfc = isNnfcResult(result);
      const downloadsHtml = buildDownloadButtons(nnfc);
      const resultActionsHtml = `
        <div class="results-header-actions">
          ${scoreChip}
          <button class="result-action-btn primary" type="button" onclick="startNewConsultation(true)">New</button>
          <button class="result-action-btn" type="button" onclick="startNewConsultation(false)">Revise prompt</button>
        </div>`;

      const disclaimerText = result.nnfc_disclaimer_text || NNFC_DEFAULT_DISCLAIMER;
      const disclaimerHtml = nnfc ? renderNnfcDisclaimerBanner(disclaimerText) : "";
      const rawReportText = normalizeMarkdownInput(result.final_report_text || result.content || "");
      const reportText = nnfc ? stripNnfcDisclaimerFromMarkdown(rawReportText) : rawReportText;

      if (nnfc) {
        const customerSummary = stripNnfcDisclaimerFromMarkdown(result.customer_summary ||
          extractSectionMarkdown(reportText, /^##\s+Executive\s+Summary\s*$/im) ||
          reportText.slice(0, 1200));
        const engineerDetail = stripNnfcDisclaimerFromMarkdown(result.engineer_detail ||
          extractSectionMarkdown(reportText, /^##\s+Engineer\s+Detail\s*$/im) ||
          reportText);
        const processCards = extractProcessStepCards(customerSummary);
        const equipLog = combineValidationLogs(result.final_link_log, result.equipment_reference_log);
        const dbMatches = result.nnfc_equipment_matches || [];
        const equipLogHtml = equipLog.length ? renderLinkLogTable(equipLog) : "";
        section.innerHTML = `
        <div class="results-card results-card-nnfc">
          ${disclaimerHtml}
          <div class="results-header">
            <div>
              <div class="results-kicker">${escapeHtml(result.mode_name || "NNFC")}</div>
              <h2>Baseline Review Draft</h2>
              <p class="results-subtitle">고객용 검토용 요약 · 엔지니어 상세는 별도 탭에서 확인</p>
            </div>
            ${resultActionsHtml}
          </div>
          <div class="deliverables-bar">
            <span class="deliverables-label">Deliverables</span>
            <div class="download-row nnfc-download-row" id="download-links">${downloadsHtml || '<span class="empty-state">No files were generated.</span>'}</div>
          </div>
          ${renderNnfcNextActions(processCards, equipLog, dbMatches)}
          <div class="nnfc-primary-stack">
            <section class="nnfc-result-block">
              <div class="nnfc-section-title">Summary</div>
              <div id="summary-view" class="result-view nnfc-summary-view">
                <div class="report-viewer nnfc-summary-panel">${simpleMarkdownToHtml(customerSummary)}</div>
              </div>
            </section>
            <section class="nnfc-result-block">
              <div class="nnfc-section-title">Process</div>
              <div id="process-view" class="result-view">
                ${renderProcessStepCards(processCards)}
              </div>
            </section>
          </div>
          <div class="view-tabs view-tabs-nnfc secondary-view-dock">
            <button id="btn-runsheet" class="view-tab active" type="button" onclick="window.setViewMode('runsheet')">Run Sheet Review</button>
            <button id="btn-engineer" class="view-tab" type="button" onclick="window.setViewMode('engineer')">Engineer Detail</button>
            <button id="btn-doc" class="view-tab" type="button" onclick="window.setViewMode('document')">Full Document</button>
          </div>
          <div id="runsheet-view" class="result-view">
            ${renderNnfcRunSheet(processCards, reportText, equipLog, dbMatches)}
          </div>
          <div id="engineer-view" class="result-view hidden">
            <details class="nnfc-engineer-details" open>
              <summary>엔지니어 검토용 상세 (Reference / Constraint / Adapted Recipe)</summary>
              <div class="report-viewer">${simpleMarkdownToHtml(engineerDetail)}</div>
              ${equipLogHtml}
            </details>
          </div>
          <div id="document-view" class="result-view hidden">
            <div id="document-content" class="report-viewer">${simpleMarkdownToHtml(reportText)}</div>
          </div>
        </div>`;
        window.setViewMode("runsheet");
      } else {
        section.innerHTML = `
        <div class="results-card">
          <div class="results-header">
            <div>
              <div class="results-kicker">${escapeHtml(result.mode_name || "A1trategize")}</div>
              <h2>Final Deliverables</h2>
            </div>
            ${resultActionsHtml}
          </div>
          <div class="download-row" id="download-links">${downloadsHtml || '<span class="empty-state">No files were generated.</span>'}</div>
          <div class="view-tabs">
            <button id="btn-doc" class="view-tab active" type="button" onclick="window.setViewMode('document')">Document</button>
            <button id="btn-slide" class="view-tab" type="button" onclick="window.setViewMode('slide')">Slides</button>
          </div>
          <div id="document-view" class="result-view">
            <div id="document-content" class="report-viewer">${simpleMarkdownToHtml(reportText)}</div>
          </div>
          <div id="slide-view" class="result-view hidden">
            <div id="slide-content" class="slide-preview">${generateSlidesFromMarkdown(reportText)}</div>
          </div>
        </div>`;
        const docContent = document.getElementById("document-content");
        if (docContent) docContent.innerHTML = simpleMarkdownToHtml(reportText);
        const slideContent = document.getElementById("slide-content");
        if (slideContent) slideContent.innerHTML = generateSlidesFromMarkdown(reportText);
        window.setViewMode("document");
      }

      section.scrollIntoView({ behavior: "smooth" });
  } catch (error) { console.error("결과창 렌더링 중 오류 발생:", error); }
}

function buildDownloadButtons(isNnfc) {
    const buttons = [
      makeExportButton("docx", "Word"),
      makeExportButton("pdf", "PDF"),
      makeExportButton("pptx", "PPTX"),
    ];
    if (isNnfc) buttons.push(makeExportButton("xlsx", "Excel Run Sheet", true));
    return buttons.join("");
}

function makeExportButton(format, label, primary = false) {
    const klass = primary ? "export-chip primary" : "export-chip";
    return `<button type="button" class="${klass}" onclick="window.exportReportFile('${format}')" title="Generate ${escapeHtml(label)}">${escapeHtml(label)}</button>`;
}

window.exportReportFile = async function(format) {
  const sessionId = currentJobId || window._lastResultPayload?.session_id || window._lastResultPayload?.job_id;
  if (!sessionId) {
    alert("No completed session is available for export.");
    return;
  }
  const fmt = String(format || "").toLowerCase();
  const btn = document.querySelector(`.export-chip[onclick*="'${fmt}'"]`);
  const originalText = btn ? btn.textContent : "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Generating...";
  }
  try {
    const res = await fetch(`/api/export/${encodeURIComponent(sessionId)}/${encodeURIComponent(fmt)}`, {
      method: "POST",
    });
    if (!res.ok) {
      let message = `Export failed (${res.status})`;
      try {
        const data = await res.json();
        if (data.error) message = data.error;
      } catch (_) {}
      throw new Error(message);
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
    const filename = match ? decodeURIComponent(match[1] || match[2]) : `A1trategize_${fmt}_${dateStamp()}.${fmt}`;
    triggerDownload(blob, filename);
  } catch (error) {
    alert(error.message || "Export failed.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
};

function generateSlidesFromMarkdown(md) {
  if (!md || typeof md !== "string" || md.trim() === "") {
    return '<p class="slide-empty">슬라이드 데이터가 없습니다.</p>';
  }

  let sections = md.split(/(?=^##\s)/m).filter(s => s.trim().length > 0);
  if (sections.length === 0) sections = [md];

  return sections.map((sectionText, index) => {
    const lines = sectionText.trim().split("\n");
    if (lines.length === 0) return "";
    const title = lines[0].replace(/^#+\s*/, "").trim();
    const bodyMarkdown = lines.length > 1 ? lines.slice(1).join("\n") : "";
    return `
      <article class="ppt-slide">
        <div class="ppt-slide-accent"></div>
        <header class="ppt-slide-header">
          <h2>${escapeHtml(title)}</h2>
        </header>
        <div class="ppt-slide-body markdown-body">
          ${simpleMarkdownToHtml(bodyMarkdown)}
        </div>
        <footer class="ppt-slide-footer">
          <span>A1trategize Confidential</span>
          <span>${index + 1}</span>
        </footer>
      </article>`;
  }).join("");
}

function simpleMarkdownToHtml(md) {
  if (!md) return "<p>No report content available.</p>";
  const lines = normalizeMarkdownInput(md).split("\n");
  const html = []; let listType = null; let paragraph = [];
  const flushParagraph = () => { if (paragraph.length) { html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`); paragraph = []; } };
  const closeList = () => { if (listType) { html.push(`</${listType}>`); listType = null; } };
  const openList = (type) => { if (listType !== type) { closeList(); html.push(`<${type}>`); listType = type; } };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]; const line = raw.trim();
    if (!line) { flushParagraph(); closeList(); continue; }
    const tableSeparator = lines[i + 1] && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1]);
    if (line.includes("|") && tableSeparator) {
      flushParagraph(); closeList();
      const tableLines = [line]; i += 2;
      while (i < lines.length && lines[i].trim().includes("|")) { tableLines.push(lines[i].trim()); i += 1; }
      i -= 1; html.push(renderMarkdownTable(tableLines)); continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length; html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) { flushParagraph(); openList("ul"); html.push(`<li>${inlineMarkdown(bullet[1])}</li>`); continue; }
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) { flushParagraph(); openList("ol"); html.push(`<li>${inlineMarkdown(numbered[1])}</li>`); continue; }
    closeList(); paragraph.push(line);
  }
  flushParagraph(); closeList(); return html.join("");
}

function renderMarkdownTable(tableLines) {
  const rows = tableLines.map(line => line.replace(/^\||\|$/g, "").split("|").map(cell => cell.trim()));
  if (rows.length < 2) return `<p>${inlineMarkdown(tableLines.join(" "))}</p>`;
  const headers = rows[0]; const bodyRows = rows.slice(1);
  return `<table><thead><tr>${headers.map(cell => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${bodyRows.map(row => `<tr>${row.map(cell => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replaceAll(SOFT_BREAK_TOKEN, "<br>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function htmlAttrJson(value) { return escapeHtml(JSON.stringify(value)); }

function toggleEquipBrowser() {
  if (selectedDomain !== "nnfc") {
    closeEquipmentBrowser();
    return;
  }
  equipBrowserOpen = !equipBrowserOpen;
  const browser = document.getElementById("equip-browser");
  const equipSection = document.getElementById("equip-browser-section");
  const mainContent = document.getElementById("main-content");
  const toggleBtn = document.getElementById("equip-toggle-btn");

  if (!equipBrowserOpen) {
    closeEquipmentBrowser();
    return;
  }
  setVisible(browser, true);
  setVisible(equipSection, true);
  if (toggleBtn) {
    toggleBtn.classList.add("active");
    toggleBtn.title = "NNFC 장비 카탈로그 닫기";
  }
  
  if (equipBrowserOpen) {
      if(mainContent) mainContent.classList.add("catalog-active");
      if (equipmentData.length === 0) loadEquipment();
  } else {
      if(mainContent) mainContent.classList.remove("catalog-active");
  }
}

async function loadEquipment(category, q) {
  if (IS_STATIC_A1_PREVIEW) {
    const normalizedQuery = String(q || "").toLowerCase();
    const selectedCategory = category || equipActiveCat;

    equipmentData = STATIC_EQUIPMENT.filter((item) => {
      const itemCategory = item.structured_specs?.equipment_category || "";
      const inCategory = !selectedCategory || selectedCategory === "All" || itemCategory === selectedCategory;
      const inQuery = !normalizedQuery || item.equipment_name.toLowerCase().includes(normalizedQuery);
      return inCategory && inQuery;
    });
    equipmentCategories = [...new Set(STATIC_EQUIPMENT.map((item) => item.structured_specs?.equipment_category).filter(Boolean))];
    equipVisibleCount = EQUIPMENT_PAGE_SIZE;
    renderEquipment();
    return;
  }

  try {
    let url = "/api/equipment"; const params = [];
    if (category && category !== "All") params.push(`category=${encodeURIComponent(category)}`);
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (params.length) url += "?" + params.join("&");
    renderEquipmentLoading();
    const res = await fetch(url); const data = await res.json();
    equipmentData = data.equipment || [];
    equipmentCategories = data.categories || [];
    equipVisibleCount = EQUIPMENT_PAGE_SIZE;
    renderEquipment();
  } catch (e) { console.error("Failed to load equipment:", e); }
}

function renderEquipmentLoading() {
  const countEl = document.getElementById("equip-count");
  const grid = document.getElementById("equip-grid");
  if (countEl) countEl.textContent = "장비 목록을 불러오는 중";
  if (grid) grid.innerHTML = '<div class="equip-loading">장비 목록을 불러오는 중입니다.</div>';
}

function renderEquipment() {
  const catContainer = document.getElementById("equip-cat-filters");
  if (catContainer) {
    const allCats = ["All", ...equipmentCategories];
    catContainer.innerHTML = allCats.map(cat => `<button class="equip-cat-btn${cat === equipActiveCat ? ' active' : ''}" onclick="selectEquipCategory(${htmlAttrJson(cat)})">${escapeHtml(cat === 'All' ? '전체' : cat)}</button>`).join("");
  }
  const countEl = document.getElementById("equip-count");
  const grid = document.getElementById("equip-grid");
  if (!grid) return;
  if (equipmentData.length === 0) {
    if (countEl) countEl.textContent = "검색 결과 없음";
    grid.innerHTML = '<div class="equip-empty">검색 결과가 없습니다.</div>';
    return;
  }
  const visible = equipmentData.slice(0, equipVisibleCount);
  if (countEl) countEl.textContent = `총 ${equipmentData.length}대 중 ${visible.length}대 표시`;
  const more = equipmentData.length > visible.length
    ? `<button class="equip-load-more" type="button" onclick="showMoreEquipment()">더 보기 (${equipmentData.length - visible.length}대 남음)</button>`
    : "";
  grid.innerHTML = `${visible.map(renderEquipmentCard).join("")}${more}`;
}

function renderEquipmentCard(eq) {
  const info = eq.basic_info || {};
  const specs = eq.structured_specs || {};
  const id = Number(eq.eqpmnt_id) || 0;
  const makerModel = [info["제작사"], info["모델명"]].filter(Boolean).join(" | ") || "제작사/모델 정보 없음";
  return `
    <button class="equip-card" type="button" onclick="openEquipModal(${id})">
      <div class="equip-card-header">
        <span class="equip-badge">${escapeHtml(specs.equipment_category || "N/A")}</span>
        <span class="equip-id">ID: ${escapeHtml(id)}</span>
      </div>
      <div class="equip-card-name">${escapeHtml(eq.equipment_name || "N/A")}</div>
      <div class="equip-card-maker">${escapeHtml(makerModel)}</div>
      <div class="equip-card-footer">
        <span>${iconSvg("team")} ${escapeHtml(info["담당자"] || "N/A")}</span>
        <span>${iconSvg("link")} ${escapeHtml(info["연락처"] || "N/A")}</span>
      </div>
    </button>`;
}

function showMoreEquipment() {
  equipVisibleCount += EQUIPMENT_PAGE_SIZE;
  renderEquipment();
}

function selectEquipCategory(cat) {
  equipActiveCat = cat;
  equipVisibleCount = EQUIPMENT_PAGE_SIZE;
  const q = document.getElementById("equip-search")?.value || "";
  loadEquipment(cat, q);
}
function filterEquipment() {
  const q = document.getElementById("equip-search")?.value || "";
  window.clearTimeout(equipSearchDebounce);
  equipSearchDebounce = window.setTimeout(() => {
    equipVisibleCount = EQUIPMENT_PAGE_SIZE;
    loadEquipment(equipActiveCat, q);
  }, 180);
}

async function openEquipModal(eqId) {
  currentModalEquipId = eqId;
  try {
    modalReturnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const res = await fetch(`/api/equipment/${eqId}`); const data = await res.json();
    const eq = data.equipment; const info = eq.basic_info || {}; const specs = eq.structured_specs || {}; const rawSpecs = data.raw_specs || {};
    document.getElementById("modal-category").textContent = specs.equipment_category || "";
    document.getElementById("modal-equip-name").textContent = eq.equipment_name || "";
    const basicFields = [ ["제작사", info["제작사"]], ["모델명", info["모델명"]], ["장비아이디", info["장비아이디"]], ["구축일자", info["구축일자"]], ["담당자", info["담당자"]], ["연락처", info["연락처"]] ];
    document.getElementById("modal-basic-info").innerHTML = basicFields.filter(([, v]) => v).map(([k, v]) => `<div class="equip-detail-row"><span class="label">${escapeHtml(k)}</span><span class="value">${escapeHtml(v)}</span></div>`).join("");
    const wafers = (specs.supported_wafer_size || []).join(", ") || "N/A"; const materials = (specs.target_materials || []).join(", ") || "N/A"; const maxTemp = specs.max_temperature_celsius ? `${specs.max_temperature_celsius}℃` : "N/A"; const constraints = specs.critical_constraints || "N/A";
    document.getElementById("modal-specs").innerHTML = [ ["지원 웨이퍼", wafers], ["타겟 물질", materials], ["최대 온도", maxTemp], ["특이사항", constraints] ].map(([k, v]) => { const cls = (k === "특이사항" && v !== "N/A" && v !== "특이사항 없음") ? ' style="color:var(--error);"' : ''; return `<div class="equip-detail-row"><span class="label">${escapeHtml(k)}</span><span class="value"${cls}>${escapeHtml(v)}</span></div>`; }).join("");
    const gases = dedupeValues(specs.available_gases || []); document.getElementById("modal-gases").innerHTML = gases.length ? gases.map(g => `<span class="equip-tag gas">${escapeHtml(g)}</span>`).join("") : '<span style="color:var(--text-muted);font-size:0.82rem;">가스 정보 없음</span>';
    document.getElementById("modal-raw-specs").innerHTML = renderRawSpecs(rawSpecs);
    document.getElementById("ai-guide-result").innerHTML = ""; document.getElementById("ai-guide-btn").disabled = false;
    setVisible(document.getElementById("equip-modal-overlay"), true);
    document.body.style.overflow = "hidden";
    document.querySelector(".equip-modal-close")?.focus({ preventScroll: true });
  } catch (e) { console.error("Failed to load equipment detail:", e); }
}

function renderRawSpecs(rawSpecs) {
  const entries = Object.entries(rawSpecs || {}).filter(([, value]) => String(value || "").trim());
  if (!entries.length) {
    return '<span style="color:var(--text-muted);font-size:0.82rem;">원문 스펙 정보 없음</span>';
  }
  return entries.map(([title, value], index) => `
    <details class="equip-raw-spec-item" ${index === 0 ? "open" : ""}>
      <summary>${escapeHtml(title)}</summary>
      <pre>${escapeHtml(value)}</pre>
    </details>
  `).join("");
}

function closeEquipModal(event) {
  if (event && event.target !== document.getElementById("equip-modal-overlay")) return;
  const overlay = document.getElementById("equip-modal-overlay");
  if (!overlay || !isEquipModalOpen()) return;
  setVisible(overlay, false);
  document.body.style.overflow = "";
  currentModalEquipId = null;
  modalReturnFocusEl?.focus?.({ preventScroll: true });
  modalReturnFocusEl = null;
}

function isEquipModalOpen() {
  const overlay = document.getElementById("equip-modal-overlay");
  return Boolean(overlay && !overlay.classList.contains("is-hidden") && !overlay.hasAttribute("hidden"));
}

async function requestAIGuide() {
  if (!currentModalEquipId) return;
  const btn = document.getElementById("ai-guide-btn"); const resultDiv = document.getElementById("ai-guide-result");
  btn.disabled = true; resultDiv.innerHTML = '<div class="equip-ai-loading"><div class="spinner"></div>장비 데이터를 분석하여 AI 가이드를 생성 중입니다...</div>';
  try {
    const res = await fetch(`/api/equipment/${currentModalEquipId}/ai-guide`, { method: "POST" }); const data = await res.json();
    if (data.guide) { resultDiv.innerHTML = `<div class="equip-ai-result">${simpleMarkdownToHtml(data.guide)}</div>`; } else { resultDiv.innerHTML = `<div class="equip-ai-result" style="color:var(--error);">AI 가이드 생성에 실패했습니다: ${escapeHtml(data.error || 'Unknown error')}</div>`; }
  } catch (e) { resultDiv.innerHTML = `<div class="equip-ai-result" style="color:var(--error);">네트워크 오류가 발생했습니다.</div>`; }
  btn.disabled = false;
}

