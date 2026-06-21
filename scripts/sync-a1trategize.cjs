const fs = require("fs");
const path = require("path");

const sourceDir =
  process.env.A1TRATEGIZE_STATIC_DIR || "C:\\Projects\\A1trategize\\static";
const previewBasePath = "/a1trategize-preview";
const previewDir = path.resolve(__dirname, "..", "public", "a1trategize-preview");

if (!fs.existsSync(sourceDir)) {
  console.log(`[Sync] Source directory ${sourceDir} not found. Skipping A1trategize preview sync.`);
  process.exit(0);
}

if (!fs.existsSync(previewDir)) {
  fs.mkdirSync(previewDir, { recursive: true });
}

const staticPreviewApiPatch = `
const STATIC_PREVIEW_DOMAINS = [
  { key: "business", label: "Business Strategy", icon_id: "mode-business", description: "Strategic planning, market analysis, and growth strategies." },
  { key: "career", label: "Career & Interview", icon_id: "mode-career", description: "Resume review, career path coaching, and interview prep." },
  { key: "ip", label: "IP & Patent", icon_id: "mode-ip", description: "Patent drafting, prior art search, and IP strategy." },
  { key: "nnfc", label: "NNFC Recipe", icon_id: "mode-nnfc", description: "NNFC semiconductor process recipe validation against 183 tools." }
];

const STATIC_PREVIEW_EQUIPMENT = [
  {
    eqpmnt_id: 101,
    equipment_name: "SORONA Multi-Target Sputter",
    basic_info: { "제작사": "SORONA", "모델명": "Multi-Target Sputter", "장비아이디": "PREVIEW-101", "담당자": "Preview", "연락처": "Static data" },
    structured_specs: {
      equipment_category: "Deposition",
      supported_wafer_size: ["4 inch", "6 inch"],
      target_materials: ["Si", "V2O5", "NCM811", "Pt/Ti"],
      available_gases: ["Ar", "O2"],
      max_temperature_celsius: 300,
      critical_constraints: "Static preview fixture. Engineer confirmation required for production recipes."
    }
  },
  {
    eqpmnt_id: 102,
    equipment_name: "Photolithography Track",
    basic_info: { "제작사": "NNFC", "모델명": "Yellow Room Process", "장비아이디": "PREVIEW-102", "담당자": "Preview", "연락처": "Static data" },
    structured_specs: {
      equipment_category: "Lithography",
      supported_wafer_size: ["4 inch"],
      target_materials: ["AZ5214-E PR"],
      available_gases: ["O2"],
      max_temperature_celsius: 120,
      critical_constraints: "Exposure dose, bake condition, and descum recipe must be checked by an engineer."
    }
  }
];

const STATIC_PREVIEW_MODELS = {
  catalog: {
    "preview-research": { label: "Preview Research Model", provider: "static", supports_search: true },
    "preview-review": { label: "Preview Review Model", provider: "static", supports_search: false }
  },
  assignments: {
    research: "preview-research",
    supplementary_research: "preview-research",
    review: "preview-review",
    qa: "preview-review",
    draft: "preview-review",
    revision: "preview-review",
    critic: "preview-review",
    classification: "preview-review",
    query_expansion: "preview-review",
    presentation: "preview-review"
  }
};

function isStaticPreviewApiResource(resource) {
  return typeof window !== "undefined" &&
    window.location.pathname.startsWith("/a1trategize-preview/") &&
    String(resource || "").startsWith("/api/");
}

function staticPreviewJson(data, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  }));
}

function staticPreviewApiFetch(resource) {
  const url = new URL(String(resource), window.location.origin);
  const path = url.pathname;

  if (path === "/api/domains") return staticPreviewJson({ domains: STATIC_PREVIEW_DOMAINS });
  if (path === "/api/models") return staticPreviewJson(STATIC_PREVIEW_MODELS);
  if (path === "/api/models/assign") return staticPreviewJson({ ok: true });
  if (path === "/api/sessions") return staticPreviewJson({ sessions: [] });

  if (path === "/api/equipment") {
    const category = url.searchParams.get("category");
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const equipment = STATIC_PREVIEW_EQUIPMENT.filter((item) => {
      const itemCategory = item.structured_specs?.equipment_category || "";
      const categoryMatches = !category || category === "All" || itemCategory === category;
      const queryMatches = !q || JSON.stringify(item).toLowerCase().includes(q);
      return categoryMatches && queryMatches;
    });
    const categories = Array.from(new Set(STATIC_PREVIEW_EQUIPMENT.map((item) => item.structured_specs?.equipment_category).filter(Boolean)));
    return staticPreviewJson({ equipment, categories });
  }

  const equipmentDetail = path.match(/^\\/api\\/equipment\\/(\\d+)$/);
  if (equipmentDetail) {
    const equipment = STATIC_PREVIEW_EQUIPMENT.find((item) => String(item.eqpmnt_id) === equipmentDetail[1]) || STATIC_PREVIEW_EQUIPMENT[0];
    return staticPreviewJson({
      equipment,
      raw_specs: {
        Preview: "Static portfolio preview fixture. Live equipment DB is available only inside the A1trategize app."
      }
    });
  }

  if (/^\\/api\\/equipment\\/\\d+\\/ai-guide$/.test(path)) {
    return staticPreviewJson({
      guide: "Static preview guide: verify target material, wafer size, gas availability, and process limits with the responsible engineer before running the recipe."
    });
  }

  return staticPreviewJson({ error: "Static embedded preview endpoint." }, 404);
}
`;

const patchStaticPreviewApp = (textContent) =>
  textContent
    .replace(
      /function apiFetch\(resource, options = \{\}\) \{\s*syncApiTokenCookie\(\);/,
      `${staticPreviewApiPatch}
function apiFetch(resource, options = {}) {
  if (isStaticPreviewApiResource(resource)) return staticPreviewApiFetch(resource, options);
  syncApiTokenCookie();`
    )
    .replace(
      /catch\s*\(e\)\s*\{\s*console\.error\("Failed to load domains:",\s*e\);\s*\}/g,
      `catch (e) {
      domainRegistry = [
        { key: "business", label: "Business Strategy", icon_id: "mode-business", description: "Strategic planning, market analysis, and growth strategies." },
        { key: "career", label: "Career & Interview", icon_id: "mode-career", description: "Resume review, career path coaching, and interview prep." },
        { key: "ip", label: "IP & Patent", icon_id: "mode-ip", description: "Patent drafting, prior art search, and IP strategy." },
        { key: "nnfc", label: "NNFC Recipe", icon_id: "mode-nnfc", description: "NNFC semiconductor process recipe validation against 183 tools." }
      ];
      renderDomainControls(domainRegistry);
    }`
    )
    .replace(/IS_STATIC_A1_MOCK/g, "IS_STATIC_A1_PREVIEW")
    .replace(/__a1_mock_storage_probe__/g, "__a1_preview_storage_probe__");

for (const file of fs.readdirSync(sourceDir)) {
  const sourceFile = path.join(sourceDir, file);
  const destFile = path.join(previewDir, file);

  if (!fs.statSync(sourceFile).isFile()) continue;

  const content = fs.readFileSync(sourceFile);

  if (file.endsWith(".html") || file.endsWith(".css") || file.endsWith(".js")) {
    let textContent = content
      .toString("utf8")
      .replace(/(["'(=])\/static\//g, `$1${previewBasePath}/`)
      .replace(/\/a1trategize-mock\//g, `${previewBasePath}/`)
      .replace(/@import url\(['"]https:\/\/fonts\.googleapis\.com[^'"]+['"]\);\s*/g, "")
      .replace(/\s*<link[^>]+https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard[^>]+>\s*/g, "\n");

    if (file === "app.js") {
      textContent = patchStaticPreviewApp(textContent);
    }

    fs.writeFileSync(destFile, textContent, "utf8");
    console.log(`[Sync] Copied and patched: ${file}`);
    continue;
  }

  fs.writeFileSync(destFile, content);
  console.log(`[Sync] Copied: ${file}`);
}

console.log("[Sync] A1trategize preview UI has been synced successfully.");
