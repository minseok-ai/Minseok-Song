type AdminEnv = {
  readonly ADMIN_GITHUB_ID?: string;
  readonly ADMIN_GITHUB_IDS?: string;
  readonly ADMIN_GITHUB_LOGIN?: string;
  readonly ADMIN_GITHUB_LOGINS?: string;
  readonly ADMIN_GITHUB_USERNAME?: string;
  readonly ADMIN_GITHUB_USERNAMES?: string;
};

type AuthUser = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  username?: unknown;
};

export type AuthSessionLike = {
  user?: AuthUser | null;
} | null;

export function getAuthAdminConfig(env: AdminEnv) {
  const adminIds = [
    ...parseCsv(env.ADMIN_GITHUB_ID || import.meta.env.ADMIN_GITHUB_ID || (typeof process !== "undefined" ? process.env.ADMIN_GITHUB_ID : undefined)),
    ...parseCsv(env.ADMIN_GITHUB_IDS || import.meta.env.ADMIN_GITHUB_IDS || (typeof process !== "undefined" ? process.env.ADMIN_GITHUB_IDS : undefined))
  ];
  const adminUsernames = [
    ...parseCsv(env.ADMIN_GITHUB_LOGIN || import.meta.env.ADMIN_GITHUB_LOGIN || (typeof process !== "undefined" ? process.env.ADMIN_GITHUB_LOGIN : undefined)),
    ...parseCsv(env.ADMIN_GITHUB_LOGINS || import.meta.env.ADMIN_GITHUB_LOGINS || (typeof process !== "undefined" ? process.env.ADMIN_GITHUB_LOGINS : undefined)),
    ...parseCsv(env.ADMIN_GITHUB_USERNAME || import.meta.env.ADMIN_GITHUB_USERNAME || (typeof process !== "undefined" ? process.env.ADMIN_GITHUB_USERNAME : undefined)),
    ...parseCsv(env.ADMIN_GITHUB_USERNAMES || import.meta.env.ADMIN_GITHUB_USERNAMES || (typeof process !== "undefined" ? process.env.ADMIN_GITHUB_USERNAMES : undefined))
  ].map((username) => username.toLowerCase());

  return {
    adminIds,
    adminUsernames,
    isConfigured: adminIds.length > 0 || adminUsernames.length > 0
  };
}

export function isAllowedAuthAdminSession(
  session: AuthSessionLike,
  env: AdminEnv
) {
  const config = getAuthAdminConfig(env);

  if (!config.isConfigured || !session?.user) {
    return false;
  }

  const githubId = stringify(session.user.id);
  const githubUsername = stringify(session.user.username).toLowerCase();

  return (
    (githubId && config.adminIds.includes(githubId)) ||
    (githubUsername && config.adminUsernames.includes(githubUsername))
  );
}

export function getAuthAdminLabel(session: AuthSessionLike) {
  const user = session?.user;
  const name = stringify(user?.name);
  const username = stringify(user?.username);
  const email = stringify(user?.email);

  return username || name || email || "GitHub admin";
}

function parseCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringify(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}
