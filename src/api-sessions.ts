import type { Env } from "./types";
import { listMessagesForLocalPart, removeInbox, requireInboxByToken, touchInbox } from "./api-shared";
import { getClosedExpiry, json, serializeInbox } from "./utils";

export async function getSession(url: URL, env: Env): Promise<Response> {
  const inbox = await requireInboxByToken(url.searchParams.get("token"), env);
  if (inbox instanceof Response) {
    return inbox;
  }

  return json({ inbox: serializeInbox(inbox, env) });
}

export async function listSessionMessages(url: URL, env: Env): Promise<Response> {
  const inbox = await requireInboxByToken(url.searchParams.get("token"), env);
  if (inbox instanceof Response) {
    return inbox;
  }

  const activeInbox = await touchInbox(inbox, env);
  return listMessagesForLocalPart(activeInbox, env);
}

export async function deleteSession(url: URL, env: Env): Promise<Response> {
  const inbox = await requireInboxByToken(url.searchParams.get("token"), env);
  if (inbox instanceof Response) {
    return inbox;
  }

  return removeInbox(inbox, env);
}

export async function closeSession(url: URL, env: Env): Promise<Response> {
  const inbox = await requireInboxByToken(url.searchParams.get("token"), env);
  if (inbox instanceof Response) {
    return inbox;
  }

  const expiresAt = getClosedExpiry(new Date()).toISOString();
  await env.DB.prepare("UPDATE inboxes SET expires_at = ? WHERE id = ?").bind(expiresAt, inbox.id).run();
  return json({ ok: true, expiresAt });
}
