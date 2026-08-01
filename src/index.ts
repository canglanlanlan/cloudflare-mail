import {
  cleanupExpiredInboxes,
  cleanupExpiredMessages,
  closeSession,
  createInbox,
  deleteInbox,
  deleteSession,
  getAttachment,
  getInbox,
  getMessage,
  getSession,
  listMessages,
  listSessionMessages,
  storeIncomingEmail
} from "./api";
import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminPage,
  handleAdminReservedAliasDelete,
  handleAdminReservedAliases,
  handleAdminStats,
  recordDailyVisit
} from "./admin";
import { renderMinimalApp } from "./render";
import type { Env } from "./types";
import { detectRequestLocale, html, renderRobotsTxt, renderSitemapXml, textResponse } from "./utils";

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      await recordDailyVisit(request, env);
      return html(renderMinimalApp(env.INBOX_DOMAIN, url.origin, detectRequestLocale(request)));
    }

    if (request.method === "GET" && url.pathname === "/robots.txt") {
      return textResponse(renderRobotsTxt(url.origin), "text/plain; charset=utf-8");
    }

    if (request.method === "GET" && url.pathname === "/sitemap.xml") {
      return textResponse(renderSitemapXml(url.origin), "application/xml; charset=utf-8");
    }

    if (request.method === "GET" && url.pathname === "/admin") {
      return handleAdminPage(request, env);
    }

    if (request.method === "POST" && url.pathname === "/admin/login") {
      return handleAdminLogin(request, env);
    }

    if (request.method === "POST" && url.pathname === "/admin/logout") {
      return handleAdminLogout(request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/admin/stats") {
      return handleAdminStats(request, env);
    }

    if ((request.method === "GET" || request.method === "POST") && url.pathname === "/api/admin/reserved-aliases") {
      return handleAdminReservedAliases(request, env);
    }

    if (request.method === "DELETE" && /^\/api\/admin\/reserved-aliases\/[^/]+$/.test(url.pathname)) {
      const alias = decodeURIComponent(url.pathname.split("/").pop()!);
      return handleAdminReservedAliasDelete(alias, request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/inboxes") {
      return createInbox(request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/session") {
      return getSession(url, env);
    }

    if (request.method === "GET" && url.pathname === "/api/session/messages") {
      return listSessionMessages(url, env);
    }

    if (request.method === "DELETE" && url.pathname === "/api/session") {
      return deleteSession(url, env);
    }

    if (request.method === "POST" && url.pathname === "/api/session/close") {
      return closeSession(url, env);
    }

    if (request.method === "GET" && /^\/api\/inboxes\/[^/]+$/.test(url.pathname)) {
      const slug = decodeURIComponent(url.pathname.split("/").pop()!);
      return getInbox(slug, url, env);
    }

    if (request.method === "GET" && /^\/api\/inboxes\/[^/]+\/messages$/.test(url.pathname)) {
      const slug = decodeURIComponent(url.pathname.split("/")[3]!);
      return listMessages(slug, url, env);
    }

    if (request.method === "DELETE" && /^\/api\/inboxes\/[^/]+$/.test(url.pathname)) {
      const slug = decodeURIComponent(url.pathname.split("/").pop()!);
      return deleteInbox(slug, url, env);
    }

    if (request.method === "GET" && /^\/api\/messages\/[^/]+$/.test(url.pathname)) {
      const messageId = decodeURIComponent(url.pathname.split("/").pop()!);
      return getMessage(messageId, url, env);
    }

    if (request.method === "GET" && /^\/api\/messages\/[^/]+\/attachments\/[^/]+$/.test(url.pathname)) {
      const [, , , messageId, , attachmentId] = url.pathname.split("/");
      return getAttachment(messageId, attachmentId, url, env);
    }

    return new Response("Not Found", { status: 404 });
  },

  async email(message, env, ctx): Promise<void> {
    ctx.waitUntil(storeIncomingEmail(message, env));
  },

  async scheduled(_event, env, ctx): Promise<void> {
    ctx.waitUntil(Promise.all([cleanupExpiredMessages(env), cleanupExpiredInboxes(env)]));
  }
} satisfies ExportedHandler<Env>;
