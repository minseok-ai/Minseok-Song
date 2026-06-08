import type { APIRoute } from "astro";
import { ADMIN_SESSION_COOKIE } from "../../../lib/auth/admin";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(ADMIN_SESSION_COOKIE, {
    path: "/"
  });

  return redirect("/admin/login?loggedOut=1", 303);
};
