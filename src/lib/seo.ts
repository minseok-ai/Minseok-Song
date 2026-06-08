import { siteConfig } from "../config/site";

export function getSiteUrl(env: ImportMetaEnv) {
  return (env.SITE_URL || siteConfig.url).replace(/\/$/, "");
}

export function absoluteUrl(pathname: string, siteUrl: string) {
  return new URL(pathname, `${siteUrl}/`).toString();
}

export function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
