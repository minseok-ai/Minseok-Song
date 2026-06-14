import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(root, "src", "content");

const expectedPages = [
  ["about", "01", "About", "/about", "profile"],
  ["a1-firms", "02", "A1 Firms", "/A1-Firm", "product"],
  ["projects", "03", "Projects", "/projects", "projectIndex"],
  ["writings", "04", "Writings", "/writings", "writingIndex"],
  ["contacts", "05", "Contacts", "/contacts", "contact"]
];

const allowedLayoutTypes = new Set([
  "profile",
  "product",
  "projectIndex",
  "writingIndex",
  "contact",
  "blank"
]);

const allowedStatuses = new Set(["draft", "published", "archived"]);
const allowedBlockTypes = new Set([
  "text",
  "callout",
  "timeline",
  "deckEmbed",
  "gallery",
  "link",
  "stats"
]);
const allowedWritingBlockTypes = new Set([
  "paragraph",
  "heading",
  "image",
  "code",
  "embed",
  "quote",
  "divider"
]);
const allowedProjectVisuals = new Set(["graph", "deck", "console", "paper", "blank"]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function listJsonFiles(dirPath) {
  return fs.readdirSync(dirPath).filter((fileName) => fileName.endsWith(".json"));
}

function assertUnique(values, message) {
  const seen = new Set();

  for (const value of values) {
    assert(!seen.has(value), `${message}: duplicate "${value}"`);
    seen.add(value);
  }
}

function assertBlockIds(blocks = [], label) {
  assertUnique(blocks.map((block) => block.id), `${label}: block ids must be unique`);
}

function assertHref(href, label) {
  assert(
    href === "#" ||
      href.startsWith("/") ||
      /^https?:\/\//.test(href) ||
      /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(href),
    `${label}: invalid href "${href}"`
  );
}

function validatePage(id, expected) {
  const filePath = path.join(contentRoot, "pages", `${id}.json`);
  assert(fs.existsSync(filePath), `Missing page content: ${filePath}`);

  const page = readJson(filePath);
  const [, num, label, routePath, layoutType] = expected;

  assert(page.navLabel === label, `${id}: expected navLabel "${label}"`);
  assert(page.path === routePath, `${id}: expected path "${routePath}"`);
  assert(page.layoutType === layoutType, `${id}: expected layoutType "${layoutType}"`);
  assert(allowedLayoutTypes.has(page.layoutType), `${id}: invalid layoutType`);
  assert(allowedStatuses.has(page.status), `${id}: invalid status`);
  assert(Number.isInteger(page.order), `${id}: order must be an integer`);
  assertBlockIds(page.blocks, `${id}`);

  for (const block of page.blocks ?? []) {
    assert(allowedBlockTypes.has(block.type), `${id}: invalid block type "${block.type}"`);
    assert(typeof block.id === "string" && block.id.length > 0, `${id}: block id is required`);

    if (block.type === "deckEmbed") {
      assert(["canva", "googleSlides", "figma", "pdf", "generic"].includes(block.provider), `${id}: invalid deck provider`);
      assert(/^https?:\/\//.test(block.src), `${id}: deckEmbed src must be absolute URL`);
      assert(/^\d+\/\d+$/.test(block.aspectRatio), `${id}: deckEmbed aspectRatio must look like 16/9`);
    }
  }

  return { id, num, label, path: page.path, layoutType: page.layoutType, blocks: page.blocks?.length ?? 0 };
}

function validateProject(fileName) {
  const project = readJson(path.join(contentRoot, "projects", fileName));

  assert(typeof project.title === "string" && project.title.length > 0, `${fileName}: title is required`);
  assert(allowedStatuses.has(project.status), `${fileName}: invalid status`);
  assert(Number.isInteger(project.order), `${fileName}: order must be an integer`);
  assert(Array.isArray(project.tags), `${fileName}: tags must be an array`);
  assert(allowedProjectVisuals.has(project.visual ?? "blank"), `${fileName}: invalid visual`);
  assert(Array.isArray(project.capabilityScores), `${fileName}: capabilityScores must be an array`);
  assert(project.capabilityScores.length === 5, `${fileName}: capabilityScores must have 5 values`);

  for (const [index, value] of project.capabilityScores.entries()) {
    assert(typeof value === "number" && value >= 0 && value <= 100, `${fileName}: capabilityScores[${index}] must be 0-100`);
  }

  for (const [index, link] of (project.links ?? []).entries()) {
    assert(typeof link.label === "string" && link.label.length > 0, `${fileName}: links[${index}].label is required`);
    assertHref(link.href, `${fileName}: links[${index}]`);
  }

  return project;
}

function main() {
  const pages = expectedPages.map(([id, ...rest]) => validatePage(id, [id, ...rest]));
  const a1Firms = pages.find((page) => page.id === "a1-firms");

  assert(a1Firms?.num === "02", "02 A1 Firms must remain the second navigation contract item");

  const pageOrders = pages.map((page) => page.num);
  assertUnique(pageOrders, "Navigation numbers must be unique");

  const projectDir = path.join(contentRoot, "projects");
  const projects = listJsonFiles(projectDir).map((fileName) => ({
    fileName,
    data: validateProject(fileName)
  }));

  assertUnique(
    projects
      .filter((project) => project.data.status === "published" && !project.data.hidden)
      .map((project) => project.data.order),
    "Published project orders must be unique"
  );

  const project = readJson(path.join(contentRoot, "projects", "a1trategize.json"));
  assert(project.title?.includes("A1trategize"), "A1trategize project seed is required");
  assert(allowedStatuses.has(project.status), "Project seed has invalid status");

  const contacts = readJson(path.join(contentRoot, "contacts", "primary.json"));
  assert(Array.isArray(contacts.channels), "Contacts channels must be an array");
  assertUnique(contacts.channels.map((channel) => channel.label), "Contact channel labels must be unique");

  for (const [index, channel] of contacts.channels.entries()) {
    assert(typeof channel.value === "string" && channel.value.length > 0, `contacts.channels[${index}].value is required`);
    if (channel.href) assertHref(channel.href, `contacts.channels[${index}]`);
  }

  for (const fileName of listJsonFiles(path.join(contentRoot, "writings"))) {
    const writing = readJson(path.join(contentRoot, "writings", fileName));
    assert(allowedStatuses.has(writing.status), `${fileName}: invalid status`);
    assertBlockIds(writing.blocks, `${fileName}`);

    for (const block of writing.blocks ?? []) {
      assert(allowedWritingBlockTypes.has(block.type), `${fileName}: invalid writing block type "${block.type}"`);
      assert(typeof block.id === "string" && block.id.length > 0, `${fileName}: block id is required`);

      if (block.type === "embed") {
        assert(["canva", "googleSlides", "figma", "pdf", "generic"].includes(block.provider), `${fileName}: invalid embed provider`);
        assert(/^https?:\/\//.test(block.src), `${fileName}: embed src must be absolute URL`);
        assert(/^\d+\/\d+$/.test(block.aspectRatio), `${fileName}: embed aspectRatio must look like 16/9`);
      }
    }
  }

  console.log(JSON.stringify({ ok: true, pages }, null, 2));
}

main();
