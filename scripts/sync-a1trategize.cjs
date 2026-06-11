const fs = require("fs");
const path = require("path");

const sourceDir =
  process.env.A1TRATEGIZE_STATIC_DIR || "C:\\Projects\\A1trategize\\static";
const destDir = path.resolve(__dirname, "..", "public", "a1trategize-mock");

if (!fs.existsSync(sourceDir)) {
  console.log(`[Sync] Source directory ${sourceDir} not found. Skipping A1trategize mock sync.`);
  process.exit(0);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const patchMockApp = (textContent) =>
  textContent.replace(
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
  );

for (const file of fs.readdirSync(sourceDir)) {
  const sourceFile = path.join(sourceDir, file);
  const destFile = path.join(destDir, file);

  if (!fs.statSync(sourceFile).isFile()) continue;

  const content = fs.readFileSync(sourceFile);

  if (file.endsWith(".html") || file.endsWith(".css") || file.endsWith(".js")) {
    let textContent = content
      .toString("utf8")
      .replace(/(["'(=])\/static\//g, "$1/a1trategize-mock/");

    if (file === "app.js") {
      textContent = patchMockApp(textContent);
    }

    fs.writeFileSync(destFile, textContent, "utf8");
    console.log(`[Sync] Copied and patched: ${file}`);
    continue;
  }

  fs.writeFileSync(destFile, content);
  console.log(`[Sync] Copied: ${file}`);
}

console.log("[Sync] A1trategize mock UI has been synced successfully.");
