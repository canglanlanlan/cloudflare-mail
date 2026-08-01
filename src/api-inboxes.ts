import type { Env } from "./types";
import { listMessagesForLocalPart, removeInbox, requireInbox, touchInbox } from "./api-shared";
import { generateAccessToken, getActiveExpiry, incrementDailyMetric, isReservedAlias, json, safeJson, sanitizeAlias } from "./utils";

export async function createInbox(request: Request, env: Env): Promise<Response> {
  const body = await safeJson(request);
  const requestedAlias = typeof body?.alias === "string" ? body.alias : "";
  const slug = crypto.randomUUID().slice(0, 8);
  const localPart = sanitizeAlias(requestedAlias);
  const token = await generateAccessToken(env);
  const now = new Date();
  const expiresAt = getActiveExpiry(now);
  const inboxId = crypto.randomUUID();

  if (!localPart) {
    return json(
      { error: "Please enter a valid alias using letters, numbers, or hyphens.", errorCode: "invalid_alias" },
      { status: 400 }
    );
  }

  if (await isReservedAlias(localPart, env)) {
    return json(
      { error: "This alias is reserved. Please choose another one.", errorCode: "reserved_alias" },
      { status: 409 }
    );
  }

  await env.DB.prepare(
    `INSERT INTO inboxes (id, slug, email_local, token, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(inboxId, slug, localPart, token, now.toISOString(), expiresAt.toISOString())
    .run();
  await incrementDailyMetric(env, "inboxes_created", now);

  return json({
    inbox: {
      id: inboxId,
      emailAddress: `${localPart}@${env.INBOX_DOMAIN}`,
      token,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    }
  });
}

export async function getInbox(slug: string, url: URL, env: Env): Promise<Response> {
  const inbox = await requireInbox(slug, url.searchParams.get("token"), env);
  if (inbox instanceof Response) {
    return inbox;
  }

  return json({
    inbox: {
      id: inbox.id,
      slug: inbox.slug,
      emailLocal: inbox.email_local,
      emailAddress: `${inbox.email_local}@${env.INBOX_DOMAIN}`,
      createdAt: inbox.created_at,
      expiresAt: inbox.expires_at,
      token: inbox.token
    }
  });
}

export async function listMessages(slug: string, url: URL, env: Env): Promise<Response> {
  const inbox = await requireInbox(slug, url.searchParams.get("token"), env);
  if (inbox instanceof Response) {
    return inbox;
  }

  const activeInbox = await touchInbox(inbox, env);
  return listMessagesForLocalPart(activeInbox, env);
}

export async function deleteInbox(slug: string, url: URL, env: Env): Promise<Response> {
  const inbox = await requireInbox(slug, url.searchParams.get("token"), env);
  if (inbox instanceof Response) {
    return inbox;
  }

  return removeInbox(inbox, env);
}
