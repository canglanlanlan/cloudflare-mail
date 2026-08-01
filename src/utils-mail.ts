import type { Env, InboxRow } from "./types";

const DEFAULT_RESERVED_ALIASES = [
  "admin",
  "administrator",
  "hostmaster",
  "mail",
  "mailer-daemon",
  "noreply",
  "no-reply",
  "postmaster",
  "root",
  "security",
  "support",
  "webmaster",
  "www"
] as const;

let reservedAliasSchemaPromise: Promise<void> | null = null;

export function parseLocalPart(address: string): string | null {
  const trimmed = address.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[0]) {
    return null;
  }
  return parts[0];
}

export function sanitizeAlias(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export async function ensureReservedAliasSchema(env: Env): Promise<void> {
  if (!reservedAliasSchemaPromise) {
    reservedAliasSchemaPromise = (async () => {
      await env.DB.exec(
        "CREATE TABLE IF NOT EXISTS reserved_aliases (alias TEXT PRIMARY KEY, created_at TEXT NOT NULL)"
      );
      await env.DB.exec(
        "CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
      );

      const seeded = await env.DB.prepare(
        "SELECT value FROM app_meta WHERE key = 'reserved_aliases_seeded'"
      ).first<{ value: string }>();

      if (!seeded) {
        const createdAt = new Date().toISOString();
        const statements = DEFAULT_RESERVED_ALIASES.map((alias) =>
          env.DB.prepare("INSERT OR IGNORE INTO reserved_aliases (alias, created_at) VALUES (?, ?)")
            .bind(alias, createdAt)
        );
        statements.push(
          env.DB.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('reserved_aliases_seeded', '1')")
        );
        await env.DB.batch(statements);
      }
    })().catch((error) => {
      reservedAliasSchemaPromise = null;
      throw error;
    });
  }

  await reservedAliasSchemaPromise;
}

export async function isReservedAlias(input: string, env: Env): Promise<boolean> {
  await ensureReservedAliasSchema(env);
  const row = await env.DB.prepare("SELECT alias FROM reserved_aliases WHERE alias = ?").bind(input).first<{ alias: string }>();
  return Boolean(row?.alias);
}

export async function listReservedAliases(env: Env): Promise<string[]> {
  await ensureReservedAliasSchema(env);
  const rows = await env.DB.prepare(
    "SELECT alias FROM reserved_aliases ORDER BY alias ASC"
  ).all<{ alias: string }>();
  return (rows.results ?? []).map((row) => row.alias);
}

export function sanitizeFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "attachment.bin";
}

export function formatSender(name: string | null, address: string): string {
  return name ? `${name} <${address}>` : address;
}

export function serializeInbox(inbox: InboxRow, env: Env) {
  return {
    slug: inbox.slug,
    emailAddress: `${inbox.email_local}@${env.INBOX_DOMAIN}`,
    createdAt: inbox.created_at,
    expiresAt: inbox.expires_at,
    lastMessageAt: inbox.last_message_at
  };
}
