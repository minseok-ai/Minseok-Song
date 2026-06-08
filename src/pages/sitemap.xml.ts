import type { APIRoute } from "astro";
import { visibleNavigationItems } from "../config/navigation";
import { writingEntries } from "../lib/content/registry";
import { absoluteUrl, getSiteUrl, xmlEscape } from "../lib/seo";

const today = new Date().toISOString();

export const GET: APIRoute = async () => {
  const siteUrl = getSiteUrl(import.meta.env);
  const sectionUrls = visibleNavigationItems().map((item) => item.path);
  const writingUrls = writingEntries
    .filter((entry) => !entry.data.hidden && entry.data.status === "published")
    .map((entry) => `/writings/${entry.id}`);
  const urls = ["/", ...sectionUrls, ...writingUrls];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (pathname) => `  <url>
    <loc>${xmlEscape(absoluteUrl(pathname, siteUrl))}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8"
    }
  });
};
