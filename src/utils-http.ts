export const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    ...init
  });

export const html = (body: string) =>
  new Response(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });

export const textResponse = (body: string, contentType: string, init?: ResponseInit) =>
  new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600"
    },
    ...init
  });

export async function safeJson(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
