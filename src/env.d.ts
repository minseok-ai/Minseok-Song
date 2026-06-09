/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly A1TRATEGIZE_URL?: string;
  readonly AUTH_SECRET?: string;
  readonly AUTH_TRUST_HOST?: string;
  readonly GITHUB_APP_ID?: string;
  readonly GITHUB_APP_PRIVATE_KEY?: string;
  readonly GITHUB_APP_INSTALLATION_ID?: string;
  readonly GITHUB_OAUTH_CLIENT_ID?: string;
  readonly GITHUB_OAUTH_CLIENT_SECRET?: string;
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;
  readonly ADMIN_GITHUB_ID?: string;
  readonly ADMIN_GITHUB_IDS?: string;
  readonly ADMIN_GITHUB_LOGIN?: string;
  readonly ADMIN_GITHUB_USERNAME?: string;
  readonly ADMIN_GITHUB_USERNAMES?: string;
  readonly ADMIN_GITHUB_LOGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
