import type { APIRoute } from "astro";
import {
  ADMIN_OAUTH_STATE_COOKIE,
  ADMIN_OAUTH_STATE_MAX_AGE_SECONDS,
  createAdminOAuthState,
  getGitHubAdminConfig,
  sanitizeAdminNext
} from "../../../../lib/auth/admin";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const config = getGitHubAdminConfig(import.meta.env);

  if (!config.isConfigured) {
    return redirect("/admin/login?error=github_config", 303);
  }

  const next = sanitizeAdminNext(url.searchParams.get("next"));
  const redirectUri = new URL("/api/admin/github/callback", url.origin).toString();
  const oauthState = createAdminOAuthState(next, config.sessionSecret);
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);

  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "read:user");
  authorizeUrl.searchParams.set("state", oauthState.state);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("code_challenge", oauthState.codeChallenge);

  cookies.set(ADMIN_OAUTH_STATE_COOKIE, oauthState.cookieValue, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !import.meta.env.DEV,
    maxAge: ADMIN_OAUTH_STATE_MAX_AGE_SECONDS
  });

  return redirect(authorizeUrl.toString(), 302);
};
