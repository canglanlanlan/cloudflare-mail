import type { Env } from "./types";
import { getShanghaiDayInfo } from "./utils-time";

let analyticsSchemaPromise: Promise<void> | null = null;

export async function ensureAnalyticsSchema(env: Env): Promise<void> {
  if (!analyticsSchemaPromise) {
    analyticsSchemaPromise = (async () => {
      await env.DB.exec(
        "CREATE TABLE IF NOT EXISTS daily_visits (day_key TEXT NOT NULL, ip_hash TEXT NOT NULL, first_seen_at TEXT NOT NULL, PRIMARY KEY (day_key, ip_hash))"
      );
      await env.DB.exec(
        "CREATE INDEX IF NOT EXISTS idx_daily_visits_first_seen_at ON daily_visits(first_seen_at)"
      );
      await env.DB.exec(
        "CREATE TABLE IF NOT EXISTS daily_metrics (day_key TEXT PRIMARY KEY, inboxes_created INTEGER NOT NULL DEFAULT 0, emails_received INTEGER NOT NULL DEFAULT 0, unclaimed_emails INTEGER NOT NULL DEFAULT 0)"
      );
      const columns = await env.DB.prepare("PRAGMA table_info(daily_metrics)").all<{ name: string }>();
      const columnNames = new Set((columns.results ?? []).map((item) => item.name));
      if (!columnNames.has("unclaimed_emails")) {
        await env.DB.exec("ALTER TABLE daily_metrics ADD COLUMN unclaimed_emails INTEGER NOT NULL DEFAULT 0");
      }
    })().catch((error) => {
      analyticsSchemaPromise = null;
      throw error;
    });
  }

  await analyticsSchemaPromise;
}

export function getClientIp(request: Request): string | null {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";
  return ip.split(",")[0]?.trim() || null;
}

export async function incrementDailyMetric(
  env: Env,
  metric: "inboxes_created" | "emails_received" | "unclaimed_emails",
  now: Date
): Promise<void> {
  await ensureAnalyticsSchema(env);
  const { dayKey } = getShanghaiDayInfo(now);

  if (metric === "inboxes_created") {
    await env.DB.prepare(
      `INSERT INTO daily_metrics (day_key, inboxes_created, emails_received, unclaimed_emails)
       VALUES (?, 1, 0, 0)
       ON CONFLICT(day_key) DO UPDATE SET
         inboxes_created = inboxes_created + 1`
    )
      .bind(dayKey)
      .run();
    return;
  }

  if (metric === "emails_received") {
    await env.DB.prepare(
      `INSERT INTO daily_metrics (day_key, inboxes_created, emails_received, unclaimed_emails)
       VALUES (?, 0, 1, 0)
       ON CONFLICT(day_key) DO UPDATE SET
         emails_received = emails_received + 1`
    )
      .bind(dayKey)
      .run();
    return;
  }

  await env.DB.prepare(
    `INSERT INTO daily_metrics (day_key, inboxes_created, emails_received, unclaimed_emails)
     VALUES (?, 0, 0, 1)
     ON CONFLICT(day_key) DO UPDATE SET
       unclaimed_emails = unclaimed_emails + 1`
  )
    .bind(dayKey)
    .run();
}
