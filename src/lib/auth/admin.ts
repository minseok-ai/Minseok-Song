import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "a1_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
export const ADMIN_OAUTH_STATE_COOKIE = "a1_admin_oauth_state";
export const ADMIN_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

type AdminEnv = {
  readonly ADMIN_USERNAME?: string;
  readonly ADMIN_PASSWORD?: string;
  readonly ADMIN_GITHUB_IDS?: string;
  readonly ADMIN_GITHUB_LOGINS?: string;
  readonly GITHUB_OAUTH_CLIENT_ID?: string;
  readonly GITHUB_OAUTH_CLIENT_SECRET?: string;
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;
  readonly SESSION_SECRET?: string;
};

export type AdminSession = {
  username: string;
  expiresAt: number;
  provider?: "password" | "github";
  githubId?: string;
  avatarUrl?: string;
};

export type GitHubAdminUser = {
  login: string;
  id: number;
  avatar_url?: string;
};

export type AdminOAuthState = {
  state: string;
  codeVerifier: string;
  next: string;
  expiresAt: number;
};

export function getAdminConfig(env: AdminEnv) {
  const username = env.ADMIN_USERNAME?.trim() ?? "";
  const password = env.ADMIN_PASSWORD ?? "";
  const sessionSecret = env.SESSION_SECRET ?? "";

  return {
    username,
    password,
    sessionSecret,
    isConfigured: Boolean(username && password && sessionSecret.length >= 32)
  };
}

export function getGitHubAdminConfig(env: AdminEnv) {
  const clientId =
    env.GITHUB_OAUTH_CLIENT_ID?.trim() || env.GITHUB_CLIENT_ID?.trim() || "";
  const clientSecret =
    env.GITHUB_OAUTH_CLIENT_SECRET || env.GITHUB_CLIENT_SECRET || "";
  const sessionSecret = env.SESSION_SECRET ?? "";
  const adminIds = parseCsv(env.ADMIN_GITHUB_IDS);
  const adminLogins = parseCsv(env.ADMIN_GITHUB_LOGINS).map((login) =>
    login.toLowerCase()
  );

  return {
    clientId,
    clientSecret,
    sessionSecret,
    adminIds,
    adminLogins,
    isConfigured: Boolean(
      clientId &&
        clientSecret &&
        sessionSecret.length >= 32 &&
        (adminIds.length > 0 || adminLogins.length > 0)
    )
  };
}

export function isAnyAdminAuthConfigured(env: AdminEnv) {
  return getAdminConfig(env).isConfigured || getGitHubAdminConfig(env).isConfigured;
}

export function verifyAdminCredentials(
  env: AdminEnv,
  candidateUsername: string,
  candidatePassword: string
) {
  const config = getAdminConfig(env);

  if (!config.isConfigured) {
    return false;
  }

  return (
    timingSafeStringEqual(candidateUsername.trim(), config.username) &&
    timingSafeStringEqual(candidatePassword, config.password)
  );
}

export function createAdminSession(
  username: string,
  sessionSecret: string,
  now = Date.now(),
  details: Omit<Partial<AdminSession>, "username" | "expiresAt"> = {}
) {
  const payload = {
    username,
    expiresAt: now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    ...details
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = sign(encodedPayload, sessionSecret);

  return `${encodedPayload}.${signature}`;
}

export function readAdminSession(
  cookies: CookieReader,
  env: AdminEnv,
  now = Date.now()
): AdminSession | null {
  const sessionSecret = env.SESSION_SECRET ?? "";

  if (sessionSecret.length < 32) {
    return null;
  }

  const cookie = cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!cookie) {
    return null;
  }

  return verifyAdminSession(cookie, sessionSecret, now);
}

export function verifyAdminSession(
  token: string,
  sessionSecret: string,
  now = Date.now()
): AdminSession | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  if (!timingSafeStringEqual(signature, sign(encodedPayload, sessionSecret))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<AdminSession>;

    if (
      typeof parsed.username !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now
    ) {
      return null;
    }

    return {
      username: parsed.username,
      expiresAt: parsed.expiresAt,
      provider: parsed.provider,
      githubId: parsed.githubId,
      avatarUrl: parsed.avatarUrl
    };
  } catch {
    return null;
  }
}

export function sanitizeAdminNext(value: unknown) {
  const next = typeof value === "string" ? value : "";

  if (!next.startsWith("/admin") || next.startsWith("/admin/login")) {
    return "/admin/writings";
  }

  return next;
}

export function createAdminOAuthState(
  next: string,
  sessionSecret: string,
  now = Date.now()
) {
  const state = randomToken(24);
  const codeVerifier = randomToken(64);
  const payload: AdminOAuthState = {
    state,
    codeVerifier,
    next: sanitizeAdminNext(next),
    expiresAt: now + ADMIN_OAUTH_STATE_MAX_AGE_SECONDS * 1000
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );

  return {
    state,
    codeVerifier,
    codeChallenge: createCodeChallenge(codeVerifier),
    cookieValue: `${encodedPayload}.${sign(encodedPayload, sessionSecret)}`
  };
}

export function verifyAdminOAuthState(
  token: string | undefined,
  expectedState: string,
  sessionSecret: string,
  now = Date.now()
) {
  if (!token || !expectedState) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  if (!timingSafeStringEqual(signature, sign(encodedPayload, sessionSecret))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<AdminOAuthState>;

    if (
      parsed.state !== expectedState ||
      typeof parsed.codeVerifier !== "string" ||
      typeof parsed.next !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now
    ) {
      return null;
    }

    return {
      state: parsed.state,
      codeVerifier: parsed.codeVerifier,
      next: sanitizeAdminNext(parsed.next),
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
}

export function isAllowedGitHubAdmin(
  user: GitHubAdminUser,
  config: ReturnType<typeof getGitHubAdminConfig>
) {
  const id = String(user.id);
  const login = user.login.toLowerCase();

  return config.adminIds.includes(id) || config.adminLogins.includes(login);
}

function sign(payload: string, sessionSecret: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

function createCodeChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function randomToken(byteLength: number) {
  return randomBytes(byteLength).toString("base64url");
}

function parseCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function timingSafeStringEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();

  return timingSafeEqual(leftHash, rightHash);
}
