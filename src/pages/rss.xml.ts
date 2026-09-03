import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";
import { projectEntries } from "../lib/content/registry";
import { absoluteUrl, getSiteUrl, xmlEscape } from "../lib/seo";

export const GET: APIRoute = async () => {
  const siteUrl = getSiteUrl(import.meta.env);
  const items = projectEntries
    .filter((entry) => !entry.data.hidden && entry.data.status === "published")
    .map((entry) => {
      const url = absoluteUrl(`/projects#project-${entry.id}`, siteUrl);
      return `    <item>
      <title>${xmlEscape(entry.data.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid>${xmlEscape(url)}</guid>
      <description>${xmlEscape(entry.data.summary)}</description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(siteConfig.name)}</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>${xmlEscape(siteConfig.description)}</description>
    <language>${xmlEscape(siteConfig.defaultLocale)}</language>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8"
    }
  });
};
