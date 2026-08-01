import PostalMime from "postal-mime";
import type { AttachmentRow, Env, InboxRow } from "./types";
import { createPendingInbox, removeInbox } from "./api-shared";
import {
  clampNumber,
  getMessageRetentionCutoff,
  isPendingToken,
  incrementDailyMetric,
  parseLocalPart,
  sanitizeFilename
} from "./utils";

export async function storeIncomingEmail(message: ForwardableEmailMessage, env: Env): Promise<void> {
  const localPart = parseLocalPart(message.to);
  if (!localPart) {
    return;
  }

  const inbox = await env.DB.prepare(
    `SELECT id, slug, email_local, token, created_at, expires_at, last_message_at
     FROM inboxes
     WHERE email_local = ? AND expires_at > ?
     ORDER BY
       CASE WHEN token LIKE 'PENDING_%' THEN 1 ELSE 0 END ASC,
       COALESCE(last_message_at, created_at) DESC,
       created_at ASC
     LIMIT 1`
  )
    .bind(localPart, new Date().toISOString())
    .first<InboxRow>();

  const now = new Date();
  let targetInbox = inbox;

  if (!targetInbox) {
    targetInbox = await createPendingInbox(localPart, now, env);
  } else if (new Date(targetInbox.expires_at).getTime() <= now.getTime()) {
    await removeInbox(targetInbox, env);
    targetInbox = await createPendingInbox(localPart, now, env);
  }

  const raw = await new Response(message.raw).arrayBuffer();
  const parser = new PostalMime();
  const parsed = await parser.parse(raw);
  const messageId = parsed.messageId || message.headers.get("message-id") || null;
  const storedMessageId = crypto.randomUUID();
  const receivedAt = new Date().toISOString();

  if (messageId) {
    const duplicate = await env.DB.prepare("SELECT id FROM messages WHERE message_id = ?").bind(messageId).first();
    if (duplicate) {
      return;
    }
  }

  const attachments = parsed.attachments ?? [];
  const hasAttachments = attachments.length > 0 ? 1 : 0;

  await env.DB.prepare(
    `INSERT INTO messages
      (id, inbox_id, message_id, from_name, from_address, to_address, subject, text_content, html_content, received_at, size_bytes, has_attachments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      storedMessageId,
      targetInbox.id,
      messageId,
      parsed.from?.name || null,
      parsed.from?.address || message.from || "",
      message.to,
      parsed.subject || null,
      parsed.text || null,
      parsed.html || null,
      receivedAt,
      raw.byteLength,
      hasAttachments
    )
    .run();

  await env.DB.prepare("UPDATE inboxes SET last_message_at = ? WHERE id = ?").bind(receivedAt, targetInbox.id).run();
  await incrementDailyMetric(env, "emails_received", now);
  if (isPendingToken(targetInbox.token)) {
    await incrementDailyMetric(env, "unclaimed_emails", now);
  }

  if (!attachments.length || !env.ATTACHMENTS) {
    return;
  }

  const maxAttachmentBytes = clampNumber(Number(env.MAX_ATTACHMENT_BYTES ?? 10_000_000), 1, 100_000_000);

  for (const attachment of attachments) {
    const content =
      typeof attachment.content === "string"
        ? new TextEncoder().encode(attachment.content)
        : attachment.content instanceof Uint8Array
          ? attachment.content
          : attachment.content
            ? new Uint8Array(attachment.content)
            : null;
    const attachmentBytes = content?.byteLength ?? 0;
    if (!attachmentBytes || attachmentBytes > maxAttachmentBytes) {
      continue;
    }

    const attachmentId = crypto.randomUUID();
    const r2Key = `${storedMessageId}/${attachmentId}/${sanitizeFilename(attachment.filename || "attachment.bin")}`;
    await env.ATTACHMENTS.put(r2Key, content, {
      httpMetadata: {
        contentType: attachment.mimeType || "application/octet-stream"
      }
    });

    await env.DB.prepare(
      `INSERT INTO attachments (id, message_id, filename, content_type, size_bytes, r2_key)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        attachmentId,
        storedMessageId,
        attachment.filename || "attachment.bin",
        attachment.mimeType || "application/octet-stream",
        attachmentBytes,
        r2Key
      )
      .run();
  }
}

export async function cleanupExpiredInboxes(env: Env): Promise<void> {
  const expiredInboxes = await env.DB.prepare(
    `SELECT id, slug, email_local, token, created_at, expires_at, last_message_at
     FROM inboxes
     WHERE expires_at <= ?`
  )
    .bind(new Date().toISOString())
    .all<InboxRow>();

  for (const inbox of expiredInboxes.results ?? []) {
    await removeInbox(inbox, env);
  }
}

export async function cleanupExpiredMessages(env: Env): Promise<void> {
  const cutoff = getMessageRetentionCutoff(new Date(), env).toISOString();
  const attachmentRows = await env.DB.prepare(
    `SELECT a.id, a.message_id, a.filename, a.content_type, a.size_bytes, a.r2_key
     FROM attachments a
     JOIN messages m ON m.id = a.message_id
     WHERE m.received_at < ?`
  )
    .bind(cutoff)
    .all<AttachmentRow>();

  if (env.ATTACHMENTS) {
    await Promise.all((attachmentRows.results ?? []).map((item) => env.ATTACHMENTS!.delete(item.r2_key)));
  }

  await env.DB.batch([
    env.DB.prepare("DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE received_at < ?)").bind(cutoff),
    env.DB.prepare("DELETE FROM messages WHERE received_at < ?").bind(cutoff)
  ]);
}
