import { ADMIN_COPY, APP_FAVICON_HREF, SITE_COPY, SITE_FAQ, UI_TRANSLATIONS } from "./i18n";
import { renderAdminDashboardScript, renderMinimalAppScript } from "./render-scripts";
import type { AdminStats, SiteLocale } from "./types";
import { escapeAttribute, escapeHtml } from "./utils";

function formatAdminVisitTime(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

export function renderAdminSetupPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${ADMIN_COPY.setupTitle}</title>
    <link rel="icon" href="${APP_FAVICON_HREF}" />
    <style>
      body { margin: 0; font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #f5f8ff; color: #152238; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      .card { width: min(520px, 100%); padding: 28px; border-radius: 24px; background: white; box-shadow: 0 24px 80px rgba(35,53,95,.12); }
      h1 { margin: 0 0 12px; font-size: 28px; }
      p { margin: 0; color: #68758c; line-height: 1.6; }
      code { background: #eef4ff; padding: 2px 6px; border-radius: 8px; }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <h1>${ADMIN_COPY.setupHeading}</h1>
        <p>${ADMIN_COPY.setupBody.replace("ADMIN_PASSWORD", "<code>ADMIN_PASSWORD</code>")}</p>
      </section>
    </main>
  </body>
</html>`;
}

export function renderAdminLoginPage(errorMessage = ""): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${ADMIN_COPY.loginTitle}</title>
    <link rel="icon" href="${APP_FAVICON_HREF}" />
    <style>
      body { margin: 0; font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%); color: #152238; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      .card { width: min(420px, 100%); padding: 28px; border-radius: 24px; background: rgba(255,255,255,.94); border: 1px solid rgba(21,34,56,.08); box-shadow: 0 24px 80px rgba(35,53,95,.12); }
      h1 { margin: 0 0 10px; font-size: 28px; text-align: center; }
      p { margin: 0 0 18px; color: #68758c; text-align: center; line-height: 1.5; }
      input { width: 100%; padding: 13px 14px; border-radius: 14px; border: 1px solid rgba(21,34,56,.12); font: inherit; box-sizing: border-box; }
      button { width: 100%; margin-top: 12px; padding: 12px 14px; border: none; border-radius: 14px; background: linear-gradient(135deg, #1f63ff 0%, #1749c7 100%); color: white; font: inherit; font-weight: 700; cursor: pointer; }
      .error { min-height: 20px; margin-top: 10px; color: #b42318; text-align: center; font-size: 14px; }
    </style>
  </head>
  <body>
    <main>
      <form class="card" method="post" action="/admin/login">
        <h1>${ADMIN_COPY.loginHeading}</h1>
        <p>${ADMIN_COPY.loginBody}</p>
        <input type="password" name="password" placeholder="${ADMIN_COPY.loginPlaceholder}" autocomplete="current-password" />
        <button type="submit">${ADMIN_COPY.loginButton}</button>
        <div class="error">${escapeHtml(errorMessage)}</div>
      </form>
    </main>
  </body>
</html>`;
}

export function renderAdminDashboardPage(stats: AdminStats): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${ADMIN_COPY.dashboardTitle}</title>
    <link rel="icon" href="${APP_FAVICON_HREF}" />
    <style>
      :root { --bg:#eef4ff; --panel:rgba(255,255,255,.92); --line:rgba(21,34,56,.08); --ink:#152238; --muted:#68758c; --success:#0f9f6e; }
      * { box-sizing: border-box; }
      body { margin:0; font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; color:var(--ink); background:linear-gradient(180deg,#f8fbff 0%,var(--bg) 100%); }
      main { max-width: 1120px; margin: 0 auto; padding: 28px 20px 40px; }
      .topbar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom: 18px; }
      h1 { margin:0; font-size: 34px; }
      .muted { color: var(--muted); }
      .topbar form button { border:none; border-radius: 12px; padding: 10px 14px; background: rgba(21,34,56,.08); color: var(--ink); font: inherit; font-weight:700; cursor:pointer; }
      .grid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
      .card { padding: 18px; border-radius: 22px; background: var(--panel); border:1px solid var(--line); box-shadow: 0 18px 60px rgba(35,53,95,.1); }
      .label { margin:0 0 10px; color: var(--muted); font-size:14px; }
      .value { margin:0; font-size: 36px; font-weight: 800; }
      .note { margin-top: 18px; padding: 16px 18px; border-radius: 18px; background: rgba(255,255,255,.76); border:1px solid var(--line); color: var(--muted); line-height:1.6; }
      .stamp { margin-top: 8px; color: var(--success); font-size: 14px; }
      .table-wrap { margin-top: 18px; padding: 16px 18px; border-radius: 22px; background: var(--panel); border:1px solid var(--line); box-shadow: 0 18px 60px rgba(35,53,95,.1); }
      .table-title { margin: 0 0 12px; font-size: 20px; }
      .form-row { display:flex; gap:10px; margin: 12px 0 16px; }
      .form-row input { flex:1; padding: 12px 14px; border:1px solid var(--line); border-radius: 14px; font: inherit; }
      .form-row button { border:none; border-radius: 14px; padding: 12px 16px; background: linear-gradient(135deg, #1f63ff 0%, #1749c7 100%); color:#fff; font: inherit; font-weight:700; cursor:pointer; }
      .alias-list { display:flex; flex-wrap:wrap; gap:10px; }
      .alias-chip { display:inline-flex; align-items:center; gap:10px; padding: 8px 10px 8px 12px; border-radius: 999px; background: rgba(31,99,255,.08); border:1px solid rgba(31,99,255,.14); }
      .alias-chip code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .alias-chip button { border:none; border-radius: 999px; padding: 6px 10px; background: rgba(21,34,56,.08); color: var(--ink); font: inherit; cursor:pointer; }
      .section-copy { margin: 0; color: var(--muted); line-height: 1.6; }
      .inline-status { min-height: 20px; margin-bottom: 12px; color: var(--success); font-size: 14px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid var(--line); font-size: 14px; }
      th { color: var(--muted); font-weight: 600; }
      tr:last-child td { border-bottom: none; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } .topbar { display:block; } .topbar form { margin-top: 12px; } }
    </style>
  </head>
  <body>
    <main>
      <div class="topbar">
        <div>
          <h1>${ADMIN_COPY.dashboardHeading}</h1>
          <div class="muted">${escapeHtml(stats.dayLabel)}</div>
          <div class="stamp">${ADMIN_COPY.dashboardRefreshHint}</div>
        </div>
        <form method="post" action="/admin/logout">
          <button type="submit">${ADMIN_COPY.dashboardLogout}</button>
        </form>
      </div>
      <section class="grid">
        <article class="card">
          <p class="label">${ADMIN_COPY.uniqueUsers}</p>
          <p class="value" id="uniqueUsers">${stats.uniqueUsers}</p>
        </article>
        <article class="card">
          <p class="label">${ADMIN_COPY.inboxesCreated}</p>
          <p class="value" id="inboxesCreated">${stats.inboxesCreated}</p>
        </article>
        <article class="card">
          <p class="label">${ADMIN_COPY.emailsReceived}</p>
          <p class="value" id="emailsReceived">${stats.emailsReceived}</p>
        </article>
        <article class="card">
          <p class="label">${ADMIN_COPY.unclaimedEmails}</p>
          <p class="value" id="unclaimedEmails">${stats.unclaimedEmails}</p>
        </article>
      </section>
      <section class="note">${ADMIN_COPY.unclaimedNote}</section>
      <section class="table-wrap">
        <h2 class="table-title">${ADMIN_COPY.reservedAliasesTitle}</h2>
        <p class="section-copy">${ADMIN_COPY.reservedAliasesBody}</p>
        <div class="form-row">
          <input id="reservedAliasInput" placeholder="${escapeAttribute(ADMIN_COPY.reservedAliasesPlaceholder)}" />
          <button type="button" id="reservedAliasAddBtn">${ADMIN_COPY.reservedAliasesAdd}</button>
        </div>
        <div class="inline-status" id="reservedAliasStatus"></div>
        <div class="alias-list" id="reservedAliasList">
          ${stats.reservedAliases.length ? stats.reservedAliases.map((alias) => `
            <div class="alias-chip">
              <code>${escapeHtml(alias)}</code>
              <button type="button" data-alias="${escapeAttribute(alias)}">${ADMIN_COPY.reservedAliasesDelete}</button>
            </div>
          `).join("") : `<div class="muted">${ADMIN_COPY.reservedAliasesEmpty}</div>`}
        </div>
      </section>
      <section class="table-wrap">
        <h2 class="table-title">${ADMIN_COPY.visitsTableTitle}</h2>
        <table>
          <thead>
            <tr>
              <th>${ADMIN_COPY.visitsFirstSeen}</th>
              <th>${ADMIN_COPY.visitsIpHash}</th>
            </tr>
          </thead>
          <tbody id="visitsTable">
            ${stats.visits.length ? stats.visits.map((visit) => `
              <tr>
                <td>${escapeHtml(formatAdminVisitTime(visit.firstSeenAt))}</td>
                <td class="mono">${escapeHtml(visit.ipHashShort)}</td>
              </tr>
            `).join("") : `
              <tr>
                <td colspan="2" class="muted">${ADMIN_COPY.visitsEmpty}</td>
              </tr>
            `}
          </tbody>
        </table>
      </section>
      <section class="table-wrap">
        <h2 class="table-title">${ADMIN_COPY.trendTableTitle}</h2>
        <table>
          <thead>
            <tr>
              <th>${ADMIN_COPY.trendDay}</th>
              <th>${ADMIN_COPY.trendUsers}</th>
              <th>${ADMIN_COPY.trendInboxes}</th>
              <th>${ADMIN_COPY.trendEmails}</th>
              <th>${ADMIN_COPY.trendUnclaimed}</th>
            </tr>
          </thead>
          <tbody id="trendTable">
            ${stats.trend.map((item) => `
              <tr>
                <td>${escapeHtml(item.dayKey)}</td>
                <td>${item.uniqueUsers}</td>
                <td>${item.inboxesCreated}</td>
                <td>${item.emailsReceived}</td>
                <td>${item.unclaimedEmails}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    </main>
    ${renderAdminDashboardScript()}
  </body>
</html>`;
}

export function renderMinimalApp(domain: string, origin: string, initialLocale: SiteLocale): string {
  const copy = SITE_COPY[initialLocale];
  const faqEntries = SITE_FAQ[initialLocale];
  const zhUi = UI_TRANSLATIONS.zh;
  const canonicalUrl = `${origin}/`;

  return `<!doctype html>
<html lang="${initialLocale === "zh" ? "zh-CN" : "en"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(copy.pageTitle)}</title>
    <meta name="keywords" content="${escapeAttribute(copy.metaKeywords)}" />
    <meta name="description" content="${escapeAttribute(copy.metaDescription)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="alternate" hreflang="zh-CN" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="alternate" hreflang="en" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(copy.pageTitle)}" />
    <meta property="og:description" content="${escapeAttribute(copy.metaDescription)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:site_name" content="Inbox Forge" />
    <meta property="og:locale" content="${copy.ogLocale}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeAttribute(copy.pageTitle)}" />
    <meta name="twitter:description" content="${escapeAttribute(copy.metaDescription)}" />
    <link rel="icon" href="${APP_FAVICON_HREF}" />
    <script type="application/ld+json">${JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: copy.pageTitle,
        url: canonicalUrl,
        inLanguage: initialLocale === "zh" ? "zh-CN" : "en",
        description: copy.metaDescription
      },
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: copy.pageTitle,
        applicationCategory: "CommunicationApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        url: canonicalUrl,
        inLanguage: initialLocale === "zh" ? "zh-CN" : "en",
        description: copy.metaDescription
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntries.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      }
    ])}</script>
    <style>
      :root {
        --bg: #eef4ff;
        --panel: rgba(255, 255, 255, 0.9);
        --panel-strong: #ffffff;
        --ink: #152238;
        --muted: #68758c;
        --line: rgba(21, 34, 56, 0.1);
        --accent: #1f63ff;
        --accent-soft: rgba(31, 99, 255, 0.08);
        --success: #0f9f6e;
        --danger: #b42318;
        --shadow: 0 24px 80px rgba(35, 53, 95, 0.12);
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        height: 100%;
        overflow: hidden;
        font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 0% 0%, rgba(31, 99, 255, 0.16), transparent 24%),
          radial-gradient(circle at 100% 0%, rgba(17, 185, 129, 0.12), transparent 20%),
          linear-gradient(180deg, #f8fbff 0%, var(--bg) 100%);
      }
      body { padding: 16px; }
      .app { max-width: 1360px; height: calc(100vh - 32px); margin: 0 auto; display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 14px; }
      .hero, .panel { background: var(--panel); border: 1px solid rgba(255, 255, 255, 0.72); box-shadow: var(--shadow); backdrop-filter: blur(16px); }
      .hero { border-radius: 28px; padding: 10px 18px 12px; text-align: center; }
      h1 { margin: 0 0 8px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(22px, 3.3vw, 38px); line-height: 1; letter-spacing: -0.03em; }
      .hero p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.3; }
      .layout { min-height: 0; display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 12px; height: 100%; }
      .panel { border-radius: 28px; min-height: 0; }
      .sidebar, .viewer { height: 100%; padding: 14px; }
      .sidebar { display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; gap: 10px; }
      .viewer { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 12px; }
      .viewer-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .card { padding: 12px; border-radius: 20px; background: var(--panel-strong); border: 1px solid var(--line); }
      .sidebar .card:last-of-type { min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr); }
      .title { margin: 0 0 4px; font-size: 16px; }
      .muted { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.4; }
      label { display: block; margin: 0 0 8px; font-size: 13px; font-weight: 700; }
      input, button { font: inherit; }
      input { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: #fbfdff; color: var(--ink); outline: none; }
      #alias { text-align: center; }
      #alias::placeholder { text-align: center; }
      input:focus { border-color: rgba(31, 99, 255, 0.35); box-shadow: 0 0 0 4px rgba(31, 99, 255, 0.08); }
      .row { display: flex; gap: 10px; }
      .row > * { flex: 1; }
      button { cursor: pointer; border: none; border-radius: 12px; padding: 10px 12px; font-weight: 700; }
      button.primary { color: white; background: linear-gradient(135deg, #1f63ff 0%, #1749c7 100%); }
      button.secondary { color: var(--accent); background: var(--accent-soft); }
      button.ghost { color: var(--ink); background: rgba(21, 34, 56, 0.06); }
      button:disabled { cursor: not-allowed; opacity: 0.5; }
      .icon-btn { width: 38px; min-width: 38px; height: 38px; padding: 0; display: inline-grid; place-items: center; }
      .icon-btn svg { width: 18px; height: 18px; stroke: currentColor; transition: transform 180ms ease; }
      .icon-btn:hover svg, .icon-btn:focus-visible svg { transform: rotate(18deg) scale(1.06); }
      .icon-btn.spinning svg { animation: spin 0.72s linear; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .pill { width: fit-content; margin-bottom: 8px; padding: 5px 9px; border-radius: 999px; background: rgba(15, 159, 110, 0.08); color: var(--success); font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
      .inbox-stack { min-height: 0; max-height: 100%; display: grid; gap: 8px; overflow: auto; }
      .inbox-slot { padding: 10px; border-radius: 16px; border: 1px solid var(--line); background: rgba(255, 255, 255, 0.76); cursor: pointer; }
      .inbox-slot.active { border-color: rgba(31, 99, 255, 0.28); box-shadow: 0 0 0 3px rgba(31, 99, 255, 0.07); }
      .slot-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
      .slot-tag { padding: 4px 8px; border-radius: 999px; background: rgba(15, 159, 110, 0.08); color: var(--success); font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
      .slot-count { color: var(--muted); font-size: 11px; }
      .address { word-break: break-all; font-size: 15px; font-weight: 700; line-height: 1.25; }
      .slot-actions { display: flex; gap: 6px; margin-top: 8px; }
      .slot-actions > * { flex: 1; padding: 8px 10px; }
      .create-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .preview-mail { margin: 0 0 10px; padding: 8px 12px; border-radius: 999px; background: rgba(31, 99, 255, 0.08); color: var(--accent); font-size: 12px; font-weight: 700; text-align: center; }
      .slot-empty { padding: 12px; border-radius: 16px; border: 1px dashed var(--line); color: var(--muted); font-size: 12px; line-height: 1.4; background: rgba(255, 255, 255, 0.5); text-align: center; }
      .status { min-height: 18px; font-size: 13px; color: var(--success); text-align: center; }
      .mail-grid { min-height: 0; display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 12px; height: 100%; }
      .message-list, .message-view { min-height: 0; border-radius: 22px; background: rgba(255, 255, 255, 0.82); border: 1px solid var(--line); }
      .message-list { overflow: auto; }
      .message-item { width: 100%; border: none; border-bottom: 1px solid rgba(21, 34, 56, 0.08); background: transparent; padding: 13px 15px; text-align: left; }
      .message-item.active { background: rgba(31, 99, 255, 0.08); }
      .message-item strong, .message-item span { display: block; }
      .message-item span { margin-top: 4px; color: var(--muted); font-size: 12px; }
      .message-view { padding: 16px; display: grid; grid-template-rows: auto auto minmax(0, 1fr); gap: 10px; overflow: auto; align-content: stretch; }
      .message-view iframe { width: 100%; min-height: 440px; height: 100%; border: 1px solid var(--line); border-radius: 14px; background: white; }
      pre { margin: 0; padding: 12px; max-height: 160px; overflow: auto; white-space: pre-wrap; word-break: break-word; border: 1px solid var(--line); border-radius: 14px; background: #f8fbff; }
      .attachments { display: flex; flex-wrap: wrap; gap: 10px; }
      .attachments a { color: var(--accent); text-decoration: none; padding: 9px 12px; border-radius: 999px; background: rgba(31, 99, 255, 0.08); border: 1px solid rgba(31, 99, 255, 0.12); }
      .message-frame { min-height: 0; height: 100%; display: grid; align-self: stretch; }
      .empty { min-height: 100%; display: grid; place-items: center; text-align: center; color: var(--muted); padding: 20px; }
      @media (max-width: 980px) {
        html, body { height: auto; overflow: auto; }
        body { padding: 12px; }
        .app { height: auto; display: block; }
        .layout, .mail-grid, .row { grid-template-columns: 1fr; display: grid; }
      }
    </style>
  </head>
  <body>
    <main class="app">
      <section class="hero">
        <h1 id="heroTitle">${escapeHtml(copy.heroTitle)}</h1>
        <p id="heroSubtitle">${escapeHtml(copy.heroSubtitle)}</p>
      </section>

      <section class="layout">
        <aside class="panel sidebar">
          <section class="card">
            <h2 class="title" id="createTitle">${escapeHtml(zhUi.create_title)}</h2>
            <p class="muted" id="createSubtitle">${escapeHtml(zhUi.create_subtitle)}</p>
            <div style="height:10px"></div>
            <div class="preview-mail" id="previewMail">${escapeHtml(zhUi.preview_default)}</div>
            <input id="alias" placeholder="${escapeAttribute(zhUi.alias_placeholder)}" />
            <div style="height:10px"></div>
            <div class="create-actions">
              <button class="primary" id="createBtn">${escapeHtml(zhUi.create_btn)}</button>
              <button class="ghost" id="randomBtn" type="button">${escapeHtml(zhUi.random_btn)}</button>
            </div>
          </section>

          <section class="card">
            <div id="inboxSlots" class="inbox-stack"></div>
          </section>

          <div class="status" id="status"></div>
        </aside>

        <section class="panel viewer">
          <div class="viewer-head">
            <div>
              <h2 class="title" id="viewerTitle">${escapeHtml(zhUi.viewer_title)}</h2>
              <p class="muted" id="viewerSubtitle">${escapeHtml(zhUi.viewer_subtitle)}</p>
            </div>
            <button class="ghost icon-btn" id="refreshBtn" type="button" aria-label="${escapeAttribute(zhUi.refresh_aria)}" title="${escapeAttribute(zhUi.refresh_aria)}">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
                <path d="M21 3v6h-6"></path>
              </svg>
            </button>
          </div>
          <div class="mail-grid">
            <div class="message-list" id="messageList">
              <div class="empty">${escapeHtml(zhUi.empty_list_initial)}</div>
            </div>
            <div class="message-view" id="messageView">
              <div class="empty">${escapeHtml(zhUi.empty_select_message)}</div>
            </div>
          </div>
        </section>
      </section>
    </main>
    ${renderMinimalAppScript(domain, initialLocale)}
  </body>
</html>`;
}
