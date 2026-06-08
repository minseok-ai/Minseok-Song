import type { APIRoute } from "astro";
import {
  ADMIN_OAUTH_STATE_COOKIE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  getGitHubAdminConfig,
  isAllowedGitHubAdmin,
  verifyAdminOAuthState
} from "../../../../lib/auth/admin";

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GitHubUserResponse = {
  login?: string;
  id?: number;
  avatar_url?: string;
};

const tokenUrl = "https://github.com/login/oauth/access_token";
const userUrl = "https://api.github.com/user";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const config = getGitHubAdminConfig(import.meta.env);

  if (!config.isConfigured) {
    return redirect("/admin/login?error=github_config", 303);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  const storedState = verifyAdminOAuthState(
    cookies.get(ADMIN_OAUTH_STATE_COOKIE)?.value,
    state,
    config.sessionSecret
  );

  cookies.delete(ADMIN_OAUTH_STATE_COOKIE, {
    path: "/"
  });

  if (!code || !storedState) {
    return redirect("/admin/login?error=github_state", 303);
  }

  const redirectUri = new URL("/api/admin/github/callback", url.origin).toString();
  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: storedState.codeVerifier
    })
  });
  const token = (await tokenResponse.json()) as GitHubTokenResponse;

  if (!tokenResponse.ok || !token.access_token || token.error) {
    return redirect("/admin/login?error=github_token", 303);
  }

  const userResponse = await fetch(userUrl, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token.access_token}`,
      "user-agent": "minseok-song-admin",
      "x-github-api-version": "2022-11-28"
    }
  });
  const user = (await userResponse.json()) as GitHubUserResponse;

  if (
    !userResponse.ok ||
    typeof user.login !== "string" ||
    typeof user.id !== "number"
  ) {
    return redirect("/admin/login?error=github_user", 303);
  }

  if (!isAllowedGitHubAdmin({ login: user.login, id: user.id }, config)) {
    return redirect("/admin/login?error=github_unauthorized", 303);
  }

  cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSession(user.login, config.sessionSecret, Date.now(), {
      provider: "github",
      githubId: String(user.id),
      avatarUrl: user.avatar_url
    }),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: !import.meta.env.DEV,
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
    }
  );

  return redirect(storedState.next, 303);
};
