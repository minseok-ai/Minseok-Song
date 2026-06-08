/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly A1TRATEGIZE_URL?: string;
  readonly GITHUB_APP_ID?: string;
  readonly GITHUB_APP_PRIVATE_KEY?: string;
  readonly GITHUB_APP_INSTALLATION_ID?: string;
  readonly GITHUB_OAUTH_CLIENT_ID?: string;
  readonly GITHUB_OAUTH_CLIENT_SECRET?: string;
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;
  readonly ADMIN_GITHUB_IDS?: string;
  readonly ADMIN_GITHUB_LOGINS?: string;
  readonly ADMIN_USERNAME?: string;
  readonly ADMIN_PASSWORD?: string;
  readonly SESSION_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
