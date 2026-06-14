import { mkdir, writeFile } from "node:fs/promises";
import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { isAllowedAuthAdminSession } from "../../../lib/auth/admin";
import { writingSchema } from "../../../lib/schemas/content";
import { createRateLimiter, createRateLimitHeaders, getClientIdentifier } from "../../../lib/rate-limiter";

const writingDirectory = new URL("../../../content/writings/", import.meta.url);

const isTrustedWriteOrigin = (request: Request) => {
  const origin = request.headers.get("origin");

  if (!origin) return true;

  return origin === new URL(request.url).origin;
};

const slugify = (value: string) => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || `writing-${Date.now()}`;
};

const rateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});

export const POST: APIRoute = async ({ request }) => {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = rateLimiter(identifier);

  if (!rateLimitResult.success) {
    return Response.json(
      {
        error: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const session = await getSession(request);

  if (!isTrustedWriteOrigin(request)) {
    return Response.json(
      {
        error: "Cross-origin admin writes are not allowed."
      },
      { status: 403 }
    );
  }

  if (!isAllowedAuthAdminSession(session, import.meta.env)) {
    return Response.json(
      {
        error: "Admin authentication is required."
      },
      { status: 401 }
    );
  }

  if (!import.meta.env.DEV) {
    return Response.json(
      {
        error: "Local file publishing is only enabled in development."
      },
      { status: 501 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json(
      {
        error: "Admin writing saves require an application/json payload."
      },
      { status: 415 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const body = payload as {
    slug?: unknown;
    writing?: unknown;
  };

  const parsed = writingSchema.safeParse(body.writing);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Writing content failed validation.",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const safeSlug = slugify(
    typeof body.slug === "string" && body.slug ? body.slug : parsed.data.title
  );
  const target = new URL(`${safeSlug}.json`, writingDirectory);

  await mkdir(writingDirectory, { recursive: true });
  await writeFile(target, `${JSON.stringify(parsed.data, null, 2)}\n`, "utf8");

  return Response.json({
    ok: true,
    slug: safeSlug,
    path: `src/content/writings/${safeSlug}.json`
  });
};
