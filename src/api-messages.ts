import type { AttachmentRow, Env, InboxRow, MessageRow } from "./types";
import { requireInboxByToken } from "./api-shared";
import { escapeHeaderValue, formatSender, getMessageRetentionCutoff, json } from "./utils";

export async function getMessage(messageId: string, url: URL, env: Env): Promise<Response> {
  const sessionInbox = await requireInboxByToken(url.searchParams.get("token"), env);
  if (sessionInbox instanceof Response) {
    return sessionInbox;
  }

  const cutoff = getMessageRetentionCutoff(new Date(), env).toISOString();
  const row = await env.DB.prepare(
    `SELECT m.id, m.inbox_id, m.message_id, m.from_name, m.from_address, m.to_address, m.subject,
            m.text_content, m.html_content, m.received_at, m.size_bytes, m.has_attachments,
            i.slug, i.email_local, i.token, i.created_at, i.expires_at, i.last_message_at
     FROM messages m
     JOIN inboxes i ON i.id = m.inbox_id
     WHERE m.id = ? AND m.received_at >= ?`
  )
    .bind(messageId, cutoff)
    .first<MessageRow & InboxRow>();

  if (!row) {
    return json({ error: "Message not found" }, { status: 404 });
  }

  if (row.email_local !== sessionInbox.email_local) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const attachments = await env.DB.prepare(
    `SELECT id, message_id, filename, content_type, size_bytes, r2_key
     FROM attachments
     WHERE message_id = ?
     ORDER BY filename ASC`
  )
    .bind(messageId)
    .all<AttachmentRow>();

  return json({
    message: {
      id: row.id,
      subject: row.subject || "(no subject)",
      from: formatSender(row.from_name, row.from_address),
      to: row.to_address,
      receivedAt: row.received_at,
      text: row.text_content || "",
      html: row.html_content || "",
      attachments: (attachments.results ?? []).map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        contentType: attachment.content_type,
        sizeBytes: attachment.size_bytes
      }))
    }
  });
}

export async function getAttachment(messageId: string, attachmentId: string, url: URL, env: Env): Promise<Response> {
  const sessionInbox = await requireInboxByToken(url.searchParams.get("token"), env);
  if (sessionInbox instanceof Response) {
    return sessionInbox;
  }

  const cutoff = getMessageRetentionCutoff(new Date(), env).toISOString();
  const row = await env.DB.prepare(
    `SELECT a.id, a.message_id, a.filename, a.content_type, a.size_bytes, a.r2_key, i.email_local
     FROM attachments a
     JOIN messages m ON m.id = a.message_id
     JOIN inboxes i ON i.id = m.inbox_id
     WHERE a.id = ? AND a.message_id = ? AND m.received_at >= ?`
  )
    .bind(attachmentId, messageId, cutoff)
    .first<AttachmentRow & { email_local: string }>();

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  if (row.email_local !== sessionInbox.email_local) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!env.ATTACHMENTS) {
    return new Response("Attachment bucket is not configured", { status: 501 });
  }

  const object = await env.ATTACHMENTS.get(row.r2_key);
  if (!object) {
    return new Response("Attachment not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "content-type": row.content_type,
      "content-length": String(row.size_bytes),
      "content-disposition": `attachment; filename="${escapeHeaderValue(row.filename)}"`
    }
  });
}
