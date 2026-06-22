const baseUrl = (process.env.A1_CHAN_BASE_URL || "http://127.0.0.1:4321").replace(/\/$/, "");

const cases = [
  {
    name: "smalltalk greeting",
    query: "안녕",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { mode: "smalltalk", intent: "smalltalk", routeId: "home" }
  },
  {
    name: "capability",
    query: "A1 Chan은 뭐 할 수 있어?",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { mode: "answer", intent: "capability", primaryId: "assistant-a1-chan" }
  },
  {
    name: "semantic hint capability routing",
    query: "너에 대해 알려줘",
    semanticHint: {
      intent: "capability",
      language: "ko",
      entities: ["A1 Chan", "site assistant"],
      answerMode: "direct",
      confidence: "high"
    },
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { mode: "answer", intent: "capability", primaryId: "assistant-a1-chan", includes: "A1 Chan" }
  },
  {
    name: "english self identity semantic hint",
    query: "Who are you?",
    semanticHint: {
      intent: "capability",
      language: "en",
      entities: ["A1 Chan", "site assistant"],
      answerMode: "direct",
      confidence: "high"
    },
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { mode: "answer", intent: "capability", primaryId: "assistant-a1-chan", includes: "A1 Chan" }
  },
  {
    name: "home current page",
    query: "이 페이지는 뭐야?",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { intent: "currentPage", routeId: "home", primaryId: "site-overview" }
  },
  {
    name: "projects current page summary",
    query: "현재 페이지 핵심만 요약해줘",
    context: { currentRouteId: "projects", lastRouteId: "projects", userHistory: [] },
    expect: { intent: "summary", routeId: "projects", primaryId: "projects-collection" }
  },
  {
    name: "writings route",
    query: "글은 어디서 봐?",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { intent: "writing", routeId: "writings" }
  },
  {
    name: "open a1 firms",
    query: "A1 Firm 열어줘",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { intent: "open", routeId: "a1-firms" }
  },
  {
    name: "a1trategize",
    query: "A1trategize가 뭐야?",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { routeId: "projects", primaryKind: "project", primaryTitleIncludes: "A1trategize" }
  },
  {
    name: "ra1 detail",
    query: "RA1 자세히 설명해줘",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { intent: "detail", routeId: "projects", primaryId: "project-ra1" }
  },
  {
    name: "follow-up detail",
    query: "더 자세히",
    context: { currentRouteId: "projects", lastRouteId: "projects", lastRecordId: "project-ra1", userHistory: ["RA1 설명해줘"] },
    expect: { intent: "detail", routeId: "projects", primaryId: "project-ra1" }
  },
  {
    name: "confusion keeps context",
    query: "이해가 안 돼",
    context: { currentRouteId: "projects", lastRouteId: "projects", lastRecordId: "project-ra1", userHistory: ["RA1 설명해줘"] },
    expect: { intent: "confusion", routeId: "projects", primaryId: "project-ra1" }
  },
  {
    name: "contact",
    query: "연락하고 싶어",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { mode: "navigate", intent: "contact", routeId: "contacts", primaryId: "contact-primary" }
  },
  {
    name: "project collection",
    query: "프로젝트 전체를 분류해줘",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { intent: "projectCollection", routeId: "projects", primaryId: "projects-collection", dynamicProjectCount: true }
  },
  {
    name: "compare projects",
    query: "KRISS 초음파 연구랑 배터리 프로젝트 비교해줘",
    context: { currentRouteId: "projects", lastRouteId: "projects", userHistory: [] },
    expect: { intent: "compare", routeId: "projects", primaryKind: "project", minProjectCards: 2 }
  },
  {
    name: "recommend projects",
    query: "대표 프로젝트 추천해줘",
    context: { currentRouteId: "projects", lastRouteId: "projects", userHistory: [] },
    expect: { intent: "recommendation", routeId: "projects", minProjectCards: 3 }
  },
  {
    name: "english ra1",
    query: "What is RA1?",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { routeId: "projects", primaryId: "project-ra1", detectedLanguage: "en" }
  },
  {
    name: "ultrasonic glucose",
    query: "초음파 혈당 연구 설명해줘",
    context: { currentRouteId: "home", lastRouteId: "home", userHistory: [] },
    expect: { routeId: "projects", primaryId: "project-glucose-ultrasound" }
  },
  {
    name: "FINAN SEE english title",
    query: "FINAN SEE가 뭐야?",
    context: { currentRouteId: "projects", lastRouteId: "projects", userHistory: [] },
    expect: { routeId: "projects", primaryId: "project-finance-see", includes: "FINAN SEE" }
  },
  {
    name: "KRISS collaborator timeline",
    query: "KRISS Collaborator 경력 설명해줘",
    context: { currentRouteId: "about", lastRouteId: "about", userHistory: [] },
    expect: { routeId: "about", primaryId: "person-minseok-song", includes: "Collaborator" }
  },
  {
    name: "KRISS intern timeline",
    query: "KRISS 인턴 연구원도 있었어?",
    context: { currentRouteId: "about", lastRouteId: "about", userHistory: [] },
    expect: { routeId: "about", primaryId: "person-minseok-song", includes: "Research Intern" }
  },
  {
    name: "patent filing",
    query: "특허 출원 프로젝트 설명해줘",
    context: { currentRouteId: "projects", lastRouteId: "projects", userHistory: [] },
    expect: { routeId: "projects", primaryId: "project-patent-filings" }
  },
  {
    name: "locked micro battery",
    query: "Planar Micro-Battery Architecture 세부 공정 알려줘",
    context: { currentRouteId: "projects", lastRouteId: "projects", userHistory: [] },
    expect: {
      routeId: "projects",
      primaryId: "project-interdigitated-devices",
      locked: true,
      forbidden: ["AZ5214", "V2O5", "NCM811", "SORONA", "rpm", "mJ/cm", "sccm"]
    }
  },
  {
    name: "explicit entity overrides last detail context",
    query: "Planar Micro-Battery Architecture 세부 공정 알려줘",
    context: { currentRouteId: "projects", lastRouteId: "projects", lastRecordId: "project-finance-see", userHistory: ["FINAN SEE가 뭐야?"] },
    expect: {
      routeId: "projects",
      primaryId: "project-interdigitated-devices",
      locked: true,
      forbidden: ["AZ5214", "V2O5", "NCM811", "SORONA", "rpm", "mJ/cm", "sccm"]
    }
  }
];

const forbiddenAnswerFragments = [
  "Direct channels for specific collaboration",
  "Portfolio notes, build logs",
  "The public product page for A1trategize",
  "C:\\tmp",
  "Chrome User Data",
  "weights.bin"
];

async function postCase(testCase) {
  const response = await fetch(`${baseUrl}/api/a1-chan`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      query: testCase.query,
      context: testCase.context,
      semanticHint: testCase.semanticHint
    })
  });

  if (!response.ok) {
    throw new Error(`${testCase.name}: HTTP ${response.status}`);
  }

  return response.json();
}

function assertEqual(errors, label, actual, expected) {
  if (expected === undefined) return;
  if (actual !== expected) {
    errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

let failed = 0;

for (const testCase of cases) {
  const errors = [];
  try {
    const payload = await postCase(testCase);
    const result = payload.staticResult;
    const pack = payload.contextPack;
    const primaryId = pack?.primaryRecord?.id;
    const answer = String(result?.answer || "");

    assertEqual(errors, "mode", result?.mode, testCase.expect.mode);
    assertEqual(errors, "intent", pack?.intent, testCase.expect.intent);
    assertEqual(errors, "routeId", result?.routeId, testCase.expect.routeId);
    assertEqual(errors, "primaryId", primaryId, testCase.expect.primaryId);
    assertEqual(errors, "primaryKind", pack?.primaryRecord?.kind, testCase.expect.primaryKind);
    assertEqual(errors, "detectedLanguage", result?.detectedLanguage, testCase.expect.detectedLanguage);

    if (testCase.expect.primaryTitleIncludes && !String(pack?.primaryRecord?.title || "").includes(testCase.expect.primaryTitleIncludes)) {
      errors.push(`primary title: expected to include ${JSON.stringify(testCase.expect.primaryTitleIncludes)}`);
    }

    if (testCase.expect.includes && !answer.includes(testCase.expect.includes)) {
      errors.push(`answer: expected to include ${JSON.stringify(testCase.expect.includes)}`);
    }

    if (testCase.expect.dynamicProjectCount) {
      const projectCount = Array.isArray(result?.contextCards)
        ? result.contextCards.filter((card) => card.kind === "project").length
        : 0;
      if (!projectCount) {
        errors.push("dynamicProjectCount: expected project cards in response context");
      } else if (!answer.includes(`${projectCount}개 공개 프로젝트`)) {
        errors.push(`answer: expected dynamic project count ${projectCount}`);
      }
    }

    if (testCase.expect.minProjectCards) {
      const projectCount = Array.isArray(result?.contextCards)
        ? result.contextCards.filter((card) => card.kind === "project").length
        : 0;
      if (projectCount < testCase.expect.minProjectCards) {
        errors.push(`project card count: expected at least ${testCase.expect.minProjectCards}, got ${projectCount}`);
      }
    }

    if (testCase.expect.locked) {
      if (!Array.isArray(payload.lockedNotices) || payload.lockedNotices.length === 0) {
        errors.push("lockedNotices: expected locked notice metadata");
      }
      if (!Array.isArray(result?.qualityFlags) || !result.qualityFlags.includes("locked-record")) {
        errors.push("qualityFlags: expected locked-record");
      }
      for (const fragment of testCase.expect.forbidden ?? []) {
        if (answer.includes(fragment)) {
          errors.push(`locked answer leaked forbidden fragment: ${fragment}`);
        }
      }
    }

    if (!Array.isArray(payload.evidenceCards) || payload.evidenceCards.length === 0) {
      errors.push("evidenceCards: expected one or more source cards");
    }

    if (!Array.isArray(payload.retrievalScores)) {
      errors.push("retrievalScores: expected array metadata");
    }

    if (!pack?.answerPlan || !Array.isArray(pack.answerPlan.evidenceIds)) {
      errors.push("answerPlan: expected structured answer plan");
    }

    if (!Array.isArray(result?.answerParts) || result.answerParts.length === 0) {
      errors.push("answerParts: expected one or more structured answer parts");
    }

    if (!Array.isArray(result?.suggestedQuestions) || result.suggestedQuestions.length === 0) {
      errors.push("suggestedQuestions: expected one or more follow-up prompts");
    }

    for (const fragment of forbiddenAnswerFragments) {
      if (answer.includes(fragment)) {
        errors.push(`answer contains forbidden fragment: ${JSON.stringify(fragment)}`);
      }
    }

    if (errors.length) {
      failed += 1;
      console.log(`FAIL ${testCase.name}`);
      for (const error of errors) console.log(`  - ${error}`);
      console.log(`  answer: ${answer}`);
    } else {
      console.log(`PASS ${testCase.name}`);
    }
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${testCase.name}`);
    console.log(`  - ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) {
  console.error(`A1 Chan eval failed: ${failed}/${cases.length}`);
  process.exit(1);
}

console.log(`A1 Chan eval passed: ${cases.length}/${cases.length}`);
