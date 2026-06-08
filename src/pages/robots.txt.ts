import type { APIRoute } from "astro";
import { absoluteUrl, getSiteUrl } from "../lib/seo";

export const GET: APIRoute = async () => {
  const siteUrl = getSiteUrl(import.meta.env);
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/

Sitemap: ${absoluteUrl("/sitemap.xml", siteUrl)}
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
};
