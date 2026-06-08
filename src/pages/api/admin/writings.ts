import { mkdir, writeFile } from "node:fs/promises";
import type { APIRoute } from "astro";
import { writingSchema } from "../../../lib/schemas/content";

const writingDirectory = new URL("../../../content/writings/", import.meta.url);

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

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return Response.json(
      {
        error: "Local file publishing is only enabled in development."
      },
      { status: 501 }
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
