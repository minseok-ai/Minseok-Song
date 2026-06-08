/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly A1TRATEGIZE_API_ORIGIN?: string;
  readonly GITHUB_APP_ID?: string;
  readonly GITHUB_APP_PRIVATE_KEY?: string;
  readonly GITHUB_APP_INSTALLATION_ID?: string;
  readonly ADMIN_GITHUB_IDS?: string;
  readonly SESSION_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
