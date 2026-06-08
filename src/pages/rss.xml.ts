import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";
import { writingEntries } from "../lib/content/registry";
import { absoluteUrl, getSiteUrl, xmlEscape } from "../lib/seo";

export const GET: APIRoute = async () => {
  const siteUrl = getSiteUrl(import.meta.env);
  const writings = writingEntries
    .filter((entry) => !entry.data.hidden && entry.data.status === "published")
    .sort((a, b) => {
      const left = a.data.date ? Date.parse(a.data.date) : 0;
      const right = b.data.date ? Date.parse(b.data.date) : 0;

      return right - left || a.data.order - b.data.order;
    });

  const items = writings
    .map((entry) => {
      const url = absoluteUrl(`/writings/${entry.id}`, siteUrl);
      const pubDate = entry.data.date
        ? new Date(entry.data.date).toUTCString()
        : new Date().toUTCString();

      return `    <item>
      <title>${xmlEscape(entry.data.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid>${xmlEscape(url)}</guid>
      <pubDate>${xmlEscape(pubDate)}</pubDate>
      <description>${xmlEscape(entry.data.summary)}</description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(`${siteConfig.name} Writings`)}</title>
    <link>${xmlEscape(absoluteUrl("/writings", siteUrl))}</link>
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
