import type { APIRoute } from "astro";

const DEV_API_ORIGIN = "http://127.0.0.1:8080";

const proxyA1trategizeApi: APIRoute = async ({ params, request }) => {
  const configuredOrigin = import.meta.env.A1TRATEGIZE_API_ORIGIN;
  const apiOrigin = configuredOrigin || (import.meta.env.DEV ? DEV_API_ORIGIN : "");

  if (!apiOrigin) {
    return Response.json(
      {
        error: "A1trategize API origin is not configured.",
        env: "A1TRATEGIZE_API_ORIGIN"
      },
      { status: 502 }
    );
  }

  const apiPath = params.path ?? "";
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`/api/${apiPath}`, apiOrigin);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  let upstream: Response;

  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual"
    });
  } catch (error) {
    return Response.json(
      {
        error: "A1trategize API backend is unreachable.",
        target: targetUrl.origin,
        detail: error instanceof Error ? error.message : "Unknown fetch error"
      },
      { status: 502 }
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers
  });
};

export const GET = proxyA1trategizeApi;
export const POST = proxyA1trategizeApi;
export const PUT = proxyA1trategizeApi;
export const PATCH = proxyA1trategizeApi;
export const DELETE = proxyA1trategizeApi;
export const OPTIONS = proxyA1trategizeApi;
