import type { AttachmentRow, Env, InboxRow, MessageRow } from "./types";
import {
  createPendingToken,
  formatSender,
  getActiveExpiry,
  getMessageRetentionCutoff,
  getPendingExpiry,
  json,
  serializeInbox
} from "./utils";

export async function listMessagesForLocalPart(inbox: InboxRow, env: Env): Promise<Response> {
  const cutoff = getMessageRetentionCutoff(new Date(), env).toISOString();
  const rows = await env.DB.prepare(
    `SELECT id, inbox_id, message_id, from_name, from_address, to_address, subject,
            text_content, html_content, received_at, size_bytes, has_attachments
     FROM messages
     WHERE inbox_id IN (
       SELECT id
       FROM inboxes
       WHERE email_local = ?
     )
     AND received_at >= ?
     ORDER BY received_at DESC
     LIMIT 100`
  )
    .bind(inbox.email_local, cutoff)
    .all<MessageRow>();

  return json({
    inbox: serializeInbox(inbox, env),
    messages: (rows.results ?? []).map((row) => ({
      id: row.id,
      from: formatSender(row.from_name, row.from_address),
      subject: row.subject || "(no subject)",
      receivedAt: row.received_at,
      sizeBytes: row.size_bytes,
      hasAttachments: Boolean(row.has_attachments)
    }))
  });
}

export async function requireInbox(slug: string, token: string | null, env: Env): Promise<InboxRow | Response> {
  const inbox = await env.DB.prepare(
    `SELECT id, slug, email_local, token, created_at, expires_at, last_message_at
     FROM inboxes
     WHERE slug = ?`
  )
    .bind(slug)
    .first<InboxRow>();

  if (!inbox) {
    return json({ error: "Inbox not found" }, { status: 404 });
  }

  if (inbox.token !== token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (new Date(inbox.expires_at).getTime() <= Date.now()) {
    return json({ error: "Inbox has expired" }, { status: 410 });
  }

  return inbox;
}

export async function requireInboxByToken(token: string | null, env: Env): Promise<InboxRow | Response> {
  if (!token) {
    return json({ error: "Access code is required" }, { status: 401 });
  }

  const inbox = await env.DB.prepare(
    `SELECT id, slug, email_local, token, created_at, expires_at, last_message_at
     FROM inboxes
     WHERE token = ?`
  )
    .bind(token)
    .first<InboxRow>();

  if (!inbox) {
    return json({ error: "Inbox not found" }, { status: 404 });
  }

  if (new Date(inbox.expires_at).getTime() <= Date.now()) {
    return json({ error: "Inbox has expired" }, { status: 410 });
  }

  return inbox;
}

export async function touchInbox(inbox: InboxRow, env: Env): Promise<InboxRow> {
  const nextExpiry = getActiveExpiry(new Date()).toISOString();
  await env.DB.prepare("UPDATE inboxes SET expires_at = ? WHERE id = ?").bind(nextExpiry, inbox.id).run();
  return { ...inbox, expires_at: nextExpiry };
}

export async function removeInbox(inbox: InboxRow, env: Env): Promise<Response> {
  const siblingInbox = await env.DB.prepare(
    `SELECT id, slug, email_local, token, created_at, expires_at, last_message_at
     FROM inboxes
     WHERE email_local = ? AND id != ? AND expires_at > ?
     ORDER BY created_at ASC
     LIMIT 1`
  )
    .bind(inbox.email_local, inbox.id, new Date().toISOString())
    .first<InboxRow>();

  if (siblingInbox) {
    await env.DB.batch([
      env.DB.prepare("UPDATE messages SET inbox_id = ? WHERE inbox_id = ?").bind(siblingInbox.id, inbox.id),
      env.DB.prepare(
        `UPDATE inboxes
         SET last_message_at = (
           SELECT MAX(received_at)
           FROM messages
           WHERE inbox_id = ?
         )
         WHERE id = ?`
      ).bind(siblingInbox.id, siblingInbox.id),
      env.DB.prepare("DELETE FROM inboxes WHERE id = ?").bind(inbox.id)
    ]);

    return json({ ok: true });
  }

  const attachmentRows = await env.DB.prepare(
    `SELECT a.id, a.message_id, a.filename, a.content_type, a.size_bytes, a.r2_key
     FROM attachments a
     JOIN messages m ON m.id = a.message_id
     WHERE m.inbox_id = ?`
  )
    .bind(inbox.id)
    .all<AttachmentRow>();

  if (env.ATTACHMENTS) {
    await Promise.all((attachmentRows.results ?? []).map((item) => env.ATTACHMENTS!.delete(item.r2_key)));
  }

  await env.DB.batch([
    env.DB.prepare("DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE inbox_id = ?)").bind(inbox.id),
    env.DB.prepare("DELETE FROM messages WHERE inbox_id = ?").bind(inbox.id),
    env.DB.prepare("DELETE FROM inboxes WHERE id = ?").bind(inbox.id)
  ]);

  return json({ ok: true });
}

export async function createPendingInbox(localPart: string, now: Date, env: Env): Promise<InboxRow> {
  const inbox: InboxRow = {
    id: crypto.randomUUID(),
    slug: crypto.randomUUID().slice(0, 8),
    email_local: localPart,
    token: createPendingToken(),
    created_at: now.toISOString(),
    expires_at: getPendingExpiry(now, env).toISOString(),
    last_message_at: null
  };

  await env.DB.prepare(
    `INSERT INTO inboxes (id, slug, email_local, token, created_at, expires_at, last_message_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(inbox.id, inbox.slug, inbox.email_local, inbox.token, inbox.created_at, inbox.expires_at, null)
    .run();

  return inbox;
}
