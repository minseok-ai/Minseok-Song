import type { APIRoute } from "astro";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  getAdminConfig,
  sanitizeAdminNext,
  verifyAdminCredentials
} from "../../../lib/auth/admin";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const config = getAdminConfig(import.meta.env);

  if (!config.isConfigured) {
    return redirect("/admin/login?error=config", 303);
  }

  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const next = sanitizeAdminNext(form.get("next"));

  if (!verifyAdminCredentials(import.meta.env, username, password)) {
    return redirect(
      `/admin/login?error=credentials&next=${encodeURIComponent(next)}`,
      303
    );
  }

  cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSession(config.username, config.sessionSecret, Date.now(), {
      provider: "password"
    }),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: !import.meta.env.DEV,
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
    }
  );

  return redirect(next, 303);
};
