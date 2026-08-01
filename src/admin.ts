import { ADMIN_COPY } from "./i18n";
import { renderAdminDashboardPage, renderAdminLoginPage, renderAdminSetupPage } from "./render";
import type { AdminStats, Env } from "./types";
import {
  createCookie,
  ensureAnalyticsSchema,
  ensureReservedAliasSchema,
  getClientIp,
  getShanghaiDayInfo,
  html,
  json,
  listReservedAliases,
  parseCookies,
  safeJson,
  sanitizeAlias,
  sha256Hex
} from "./utils";

export async function handleAdminPage(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_PASSWORD) {
    return html(renderAdminSetupPage());
  }

  if (!(await isAdminAuthorized(request, env))) {
    return html(renderAdminLoginPage());
  }

  const stats = await getTodayAdminStats(env);
  return html(renderAdminDashboardPage(stats));
}

export async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_PASSWORD) {
    return new Response("ADMIN_PASSWORD is not configured", { status: 503 });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  if (password !== env.ADMIN_PASSWORD) {
    return new Response(renderAdminLoginPage(ADMIN_COPY.loginError), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
    });
  }

  const sessionValue = await getAdminSessionValue(env);
  return new Response(null, {
    status: 302,
    headers: {
      location: "/admin",
      "set-cookie": createCookie("admin_session", sessionValue, {
        httpOnly: true,
        maxAge: 60 * 60 * 12,
        path: "/",
        sameSite: "Strict",
        secure: true
      })
    }
  });
}

export async function handleAdminLogout(_request: Request, _env: Env): Promise<Response> {
  return new Response(null, {
    status: 302,
    headers: {
      location: "/admin",
      "set-cookie": createCookie("admin_session", "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
        sameSite: "Strict",
        secure: true
      })
    }
  });
}

export async function handleAdminStats(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD is not configured" }, { status: 503 });
  }

  if (!(await isAdminAuthorized(request, env))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return json(await getTodayAdminStats(env));
}

export async function handleAdminReservedAliases(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD is not configured" }, { status: 503 });
  }

  if (!(await isAdminAuthorized(request, env))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.method === "GET") {
    return json({ aliases: await listReservedAliases(env) });
  }

  if (request.method === "POST") {
    await ensureReservedAliasSchema(env);
    const body = await safeJson(request);
    const alias = sanitizeAlias(typeof body?.alias === "string" ? body.alias : "");
    if (!alias) {
      return json({ error: "Alias is required", errorCode: "invalid_alias" }, { status: 400 });
    }

    await env.DB.prepare(
      "INSERT OR IGNORE INTO reserved_aliases (alias, created_at) VALUES (?, ?)"
    )
      .bind(alias, new Date().toISOString())
      .run();

    return json({ ok: true, aliases: await listReservedAliases(env) });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

export async function handleAdminReservedAliasDelete(alias: string, request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD is not configured" }, { status: 503 });
  }

  if (!(await isAdminAuthorized(request, env))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureReservedAliasSchema(env);
  const normalizedAlias = sanitizeAlias(alias);
  if (!normalizedAlias) {
    return json({ error: "Alias is required", errorCode: "invalid_alias" }, { status: 400 });
  }

  await env.DB.prepare("DELETE FROM reserved_aliases WHERE alias = ?").bind(normalizedAlias).run();
  return json({ ok: true, aliases: await listReservedAliases(env) });
}

export async function recordDailyVisit(request: Request, env: Env): Promise<void> {
  const ip = getClientIp(request);
  if (!ip) {
    return;
  }

  await ensureAnalyticsSchema(env);
  const { dayKey } = getShanghaiDayInfo(new Date());
  const ipHash = await sha256Hex(ip);

  await env.DB.prepare(
    `INSERT OR IGNORE INTO daily_visits (day_key, ip_hash, first_seen_at)
     VALUES (?, ?, ?)`
  )
    .bind(dayKey, ipHash, new Date().toISOString())
    .run();
}

async function isAdminAuthorized(request: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) {
    return false;
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const session = cookies.admin_session;
  if (!session) {
    return false;
  }

  return session === await getAdminSessionValue(env);
}

async function getAdminSessionValue(env: Env): Promise<string> {
  return sha256Hex(`admin:${env.ADMIN_PASSWORD || ""}`);
}

async function getTodayAdminStats(env: Env): Promise<AdminStats> {
  await ensureAnalyticsSchema(env);
  await ensureReservedAliasSchema(env);
  const now = new Date();
  const dayInfo = getShanghaiDayInfo(now);
  const trend = await getSevenDayTrend(env, now);

  const [uniqueUsers, inboxesCreated, emailsReceived, unclaimedEmails, visits, reservedAliases] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM daily_visits WHERE day_key = ?").bind(dayInfo.dayKey).first<{ count: number }>(),
    env.DB.prepare(
      "SELECT inboxes_created AS count FROM daily_metrics WHERE day_key = ?"
    ).bind(dayInfo.dayKey).first<{ count: number }>(),
    env.DB.prepare(
      "SELECT emails_received AS count FROM daily_metrics WHERE day_key = ?"
    ).bind(dayInfo.dayKey).first<{ count: number }>(),
    env.DB.prepare(
      "SELECT unclaimed_emails AS count FROM daily_metrics WHERE day_key = ?"
    ).bind(dayInfo.dayKey).first<{ count: number }>(),
    env.DB.prepare(
      `SELECT first_seen_at, ip_hash
       FROM daily_visits
       WHERE day_key = ?
       ORDER BY first_seen_at DESC
       LIMIT 100`
    ).bind(dayInfo.dayKey).all<{ first_seen_at: string; ip_hash: string }>()
    ,
    listReservedAliases(env)
  ]);

  return {
    uniqueUsers: Number(uniqueUsers?.count || 0),
    inboxesCreated: Number(inboxesCreated?.count || 0),
    emailsReceived: Number(emailsReceived?.count || 0),
    unclaimedEmails: Number(unclaimedEmails?.count || 0),
    dayLabel: dayInfo.label,
    visits: (visits.results ?? []).map((row) => ({
      firstSeenAt: row.first_seen_at,
      ipHashShort: row.ip_hash.slice(0, 12)
    })),
    trend,
    reservedAliases
  };
}

async function getSevenDayTrend(env: Env, now: Date): Promise<AdminStats["trend"]> {
  const rows: AdminStats["trend"] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    const dayInfo = getShanghaiDayInfo(day);

    const [uniqueUsers, inboxesCreated, emailsReceived, unclaimedEmails] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS count FROM daily_visits WHERE day_key = ?").bind(dayInfo.dayKey).first<{ count: number }>(),
      env.DB.prepare(
        "SELECT inboxes_created AS count FROM daily_metrics WHERE day_key = ?"
      ).bind(dayInfo.dayKey).first<{ count: number }>(),
      env.DB.prepare(
        "SELECT emails_received AS count FROM daily_metrics WHERE day_key = ?"
      ).bind(dayInfo.dayKey).first<{ count: number }>(),
      env.DB.prepare(
        "SELECT unclaimed_emails AS count FROM daily_metrics WHERE day_key = ?"
      ).bind(dayInfo.dayKey).first<{ count: number }>()
    ]);

    rows.push({
      dayKey: dayInfo.dayKey,
      uniqueUsers: Number(uniqueUsers?.count || 0),
      inboxesCreated: Number(inboxesCreated?.count || 0),
      emailsReceived: Number(emailsReceived?.count || 0),
      unclaimedEmails: Number(unclaimedEmails?.count || 0)
    });
  }

  return rows;
}
