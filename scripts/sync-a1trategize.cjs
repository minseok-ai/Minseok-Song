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

const patchStaticPreviewApp = (textContent) =>
  textContent
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
      .replace(/\/a1trategize-mock\//g, `${previewBasePath}/`);

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
