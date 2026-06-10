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

export function getAuthAdminConfig(env?: AdminEnv) {
  const getEnv = (key: keyof AdminEnv) => {
    if (env && env[key]) return env[key];
    if (key === 'ADMIN_GITHUB_ID') return import.meta.env.ADMIN_GITHUB_ID;
    if (key === 'ADMIN_GITHUB_IDS') return import.meta.env.ADMIN_GITHUB_IDS;
    if (key === 'ADMIN_GITHUB_LOGIN') return import.meta.env.ADMIN_GITHUB_LOGIN;
    if (key === 'ADMIN_GITHUB_LOGINS') return import.meta.env.ADMIN_GITHUB_LOGINS;
    if (key === 'ADMIN_GITHUB_USERNAME') return import.meta.env.ADMIN_GITHUB_USERNAME;
    if (key === 'ADMIN_GITHUB_USERNAMES') return import.meta.env.ADMIN_GITHUB_USERNAMES;
    return undefined;
  };

  const adminIds = [
    ...parseCsv(getEnv('ADMIN_GITHUB_ID')),
    ...parseCsv(getEnv('ADMIN_GITHUB_IDS'))
  ];
  const adminUsernames = [
    ...parseCsv(getEnv('ADMIN_GITHUB_LOGIN')),
    ...parseCsv(getEnv('ADMIN_GITHUB_LOGINS')),
    ...parseCsv(getEnv('ADMIN_GITHUB_USERNAME')),
    ...parseCsv(getEnv('ADMIN_GITHUB_USERNAMES'))
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
