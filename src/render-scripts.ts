import { ADMIN_COPY, UI_TRANSLATIONS } from "./i18n";
import type { SiteLocale } from "./types";

export function renderAdminDashboardScript(): string {
  return `
    <script>
      const VISITS_EMPTY = ${JSON.stringify(ADMIN_COPY.visitsEmpty)};
      const TREND_EMPTY = ${JSON.stringify(ADMIN_COPY.trendEmpty)};
      const RESERVED_EMPTY = ${JSON.stringify(ADMIN_COPY.reservedAliasesEmpty)};
      const RESERVED_SAVED = ${JSON.stringify(ADMIN_COPY.reservedAliasesSaved)};
      const RESERVED_SAVE_FAILED = ${JSON.stringify(ADMIN_COPY.reservedAliasesSaveFailed)};
      const RESERVED_DELETE = ${JSON.stringify(ADMIN_COPY.reservedAliasesDelete)};
      function formatAdminVisitTime(input) {
        const date = new Date(input);
        if (Number.isNaN(date.getTime())) {
          return String(input ?? "");
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

      function renderVisitsTable(visits) {
        const tbody = document.getElementById("visitsTable");
        if (!Array.isArray(visits) || !visits.length) {
          tbody.innerHTML = '<tr><td colspan="2" class="muted">' + VISITS_EMPTY + '</td></tr>';
          return;
        }

        tbody.innerHTML = visits.map((visit) => \`
          <tr>
            <td>\${formatAdminVisitTime(visit.firstSeenAt)}</td>
            <td class="mono">\${String(visit.ipHashShort ?? "")}</td>
          </tr>
        \`).join("");
      }

      function renderTrendTable(trend) {
        const tbody = document.getElementById("trendTable");
        if (!Array.isArray(trend) || !trend.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="muted">' + TREND_EMPTY + '</td></tr>';
          return;
        }

        tbody.innerHTML = trend.map((item) => \`
          <tr>
            <td>\${String(item.dayKey ?? "")}</td>
            <td>\${String(item.uniqueUsers ?? 0)}</td>
            <td>\${String(item.inboxesCreated ?? 0)}</td>
            <td>\${String(item.emailsReceived ?? 0)}</td>
            <td>\${String(item.unclaimedEmails ?? 0)}</td>
          </tr>
        \`).join("");
      }

      function setReservedAliasStatus(message, isError = false) {
        const el = document.getElementById("reservedAliasStatus");
        el.textContent = message || "";
        el.style.color = isError ? "#b42318" : "#0f9f6e";
      }

      function renderReservedAliases(aliases) {
        const container = document.getElementById("reservedAliasList");
        if (!Array.isArray(aliases) || !aliases.length) {
          container.innerHTML = '<div class="muted">' + RESERVED_EMPTY + '</div>';
          return;
        }

        container.innerHTML = aliases.map((alias) => \`
          <div class="alias-chip">
            <code>\${String(alias ?? "")}</code>
            <button type="button" data-alias="\${String(alias ?? "").replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">\${RESERVED_DELETE}</button>
          </div>
        \`).join("");
      }

      async function saveReservedAlias() {
        const input = document.getElementById("reservedAliasInput");
        const alias = String(input.value || "").trim();
        if (!alias) {
          setReservedAliasStatus(RESERVED_SAVE_FAILED, true);
          return;
        }

        try {
          const response = await fetch("/api/admin/reserved-aliases", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ alias })
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || RESERVED_SAVE_FAILED);
          }

          input.value = "";
          renderReservedAliases(data.aliases || []);
          setReservedAliasStatus(RESERVED_SAVED);
        } catch (error) {
          setReservedAliasStatus(error.message || RESERVED_SAVE_FAILED, true);
        }
      }

      async function deleteReservedAlias(alias) {
        try {
          const response = await fetch("/api/admin/reserved-aliases/" + encodeURIComponent(alias), {
            method: "DELETE",
            credentials: "same-origin"
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || RESERVED_SAVE_FAILED);
          }

          renderReservedAliases(data.aliases || []);
          setReservedAliasStatus(RESERVED_SAVED);
        } catch (error) {
          setReservedAliasStatus(error.message || RESERVED_SAVE_FAILED, true);
        }
      }

      setInterval(async () => {
        try {
          const response = await fetch("/api/admin/stats", { credentials: "same-origin" });
          if (!response.ok) return;
          const data = await response.json();
          document.getElementById("uniqueUsers").textContent = String(data.uniqueUsers ?? 0);
          document.getElementById("inboxesCreated").textContent = String(data.inboxesCreated ?? 0);
          document.getElementById("emailsReceived").textContent = String(data.emailsReceived ?? 0);
          document.getElementById("unclaimedEmails").textContent = String(data.unclaimedEmails ?? 0);
          renderVisitsTable(data.visits);
          renderTrendTable(data.trend);
          renderReservedAliases(data.reservedAliases);
        } catch {}
      }, 60000);

      document.getElementById("reservedAliasAddBtn")?.addEventListener("click", () => {
        saveReservedAlias();
      });

      document.getElementById("reservedAliasInput")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          saveReservedAlias();
        }
      });

      document.getElementById("reservedAliasList")?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-alias]");
        if (!button) return;
        deleteReservedAlias(button.getAttribute("data-alias"));
      });
    </script>`;
}

export function renderMinimalAppScript(domain: string, initialLocale: SiteLocale): string {
  return `
    <script>
      const MAX_INBOXES = 2;
      const INITIAL_LOCALE = ${JSON.stringify(initialLocale)};
      const SESSION_STORAGE_KEY = "iiiyt-active-sessions";
      const PREVIEW_DOMAIN = ${JSON.stringify(domain)};
      const TRANSLATIONS = ${JSON.stringify(UI_TRANSLATIONS)};

      const state = {
        sessions: [],
        activeToken: null,
        polling: null,
        refreshing: false,
        locale: INITIAL_LOCALE
      };

      const el = {
        heroTitle: document.getElementById("heroTitle"),
        heroSubtitle: document.getElementById("heroSubtitle"),
        createTitle: document.getElementById("createTitle"),
        createSubtitle: document.getElementById("createSubtitle"),
        alias: document.getElementById("alias"),
        previewMail: document.getElementById("previewMail"),
        createBtn: document.getElementById("createBtn"),
        randomBtn: document.getElementById("randomBtn"),
        viewerTitle: document.getElementById("viewerTitle"),
        viewerSubtitle: document.getElementById("viewerSubtitle"),
        refreshBtn: document.getElementById("refreshBtn"),
        inboxSlots: document.getElementById("inboxSlots"),
        status: document.getElementById("status"),
        messageList: document.getElementById("messageList"),
        messageView: document.getElementById("messageView")
      };

      function setStatus(message, isError = false) {
        el.status.textContent = message || "";
        el.status.style.color = isError ? "#b42318" : "#0f9f6e";
      }

      function setRefreshing(refreshing) {
        state.refreshing = refreshing;
        if (el.refreshBtn) {
          if (refreshing) {
            el.refreshBtn.classList.remove("spinning");
            void el.refreshBtn.offsetWidth;
            el.refreshBtn.classList.add("spinning");
          } else {
            el.refreshBtn.classList.remove("spinning");
          }
        }
      }

      function getMessageSignature(messages) {
        return JSON.stringify((messages || []).map((message) => [message.id, message.subject, message.receivedAt]));
      }

      function getSession(token = state.activeToken) {
        return state.sessions.find((session) => session.inbox.token === token) || null;
      }

      function getActiveSession() {
        return getSession(state.activeToken);
      }

      function detectLocale() {
        const languages = Array.isArray(navigator.languages) && navigator.languages.length
          ? navigator.languages
          : [navigator.language || "en"];
        return languages.some((item) => String(item).toLowerCase().startsWith("zh")) ? "zh" : "en";
      }

      function t(key, vars = {}) {
        const messages = TRANSLATIONS[state.locale] || TRANSLATIONS.zh;
        const template = messages[key] || TRANSLATIONS.zh[key] || key;
        return template.replace(/\\{(\\w+)\\}/g, (_, name) => String(vars[name] ?? ""));
      }

      function getApiErrorMessage(data, fallbackKey) {
        if (data && typeof data.errorCode === "string") {
          const hasCurrentLocaleKey = Object.prototype.hasOwnProperty.call(TRANSLATIONS[state.locale] || {}, data.errorCode);
          const hasZhKey = Object.prototype.hasOwnProperty.call(TRANSLATIONS.zh || {}, data.errorCode);
          if (hasCurrentLocaleKey || hasZhKey) {
            return t(data.errorCode);
          }
        }

        if (data && typeof data.error === "string" && data.error) {
          if (data.error === "This alias is reserved. Please choose another one.") {
            return t("reserved_alias");
          }

          if (data.error === "Please enter a valid alias using letters, numbers, or hyphens.") {
            return t("invalid_alias");
          }

          return data.error;
        }

        return t(fallbackKey);
      }

      function applyLocale() {
        document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
        document.title = t("document_title");
        el.heroTitle.textContent = t("hero_title");
        el.heroSubtitle.textContent = t("hero_subtitle");
        el.createTitle.textContent = t("create_title");
        el.createSubtitle.textContent = t("create_subtitle");
        el.alias.placeholder = t("alias_placeholder");
        el.createBtn.textContent = t("create_btn");
        el.randomBtn.textContent = t("random_btn");
        el.viewerTitle.textContent = t("viewer_title");
        el.viewerSubtitle.textContent = t("viewer_subtitle");
        el.refreshBtn.setAttribute("aria-label", t("refresh_aria"));
        el.refreshBtn.setAttribute("title", t("refresh_aria"));
        renderAliasPreview();
      }

      function persistSessionSnapshot() {
        const snapshot = {
          activeToken: state.activeToken,
          tokens: state.sessions.map((session) => session.inbox.token)
        };

        if (!snapshot.tokens.length) {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }

        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
      }

      function updateCreateControls() {
        const isFull = state.sessions.length >= MAX_INBOXES;
        el.createBtn.disabled = isFull;
        el.randomBtn.disabled = isFull;
      }

      function escapeHtml(input) {
        return String(input)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function escapeAttribute(input) {
        return String(input).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
      }

      function formatBytes(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
      }

      function generateRandomAlias() {
        const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
        let alias = "";
        for (let index = 0; index < 6; index += 1) {
          alias += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        return alias;
      }

      function sanitizeAliasPreview(input) {
        return String(input || "")
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 32);
      }

      function renderAliasPreview() {
        const alias = sanitizeAliasPreview(el.alias.value);
        el.previewMail.textContent = alias
          ? \`\${alias}@\${PREVIEW_DOMAIN}\`
          : t("preview_default");
      }

      function formatInboxLabel(index) {
        return t("inbox_label", { index });
      }

      function formatMailCount(count) {
        return t("mail_count", { count });
      }

      function renderInboxSlots() {
        updateCreateControls();

        if (!state.sessions.length) {
          el.inboxSlots.innerHTML = '<div class="slot-empty">' + escapeHtml(t("slot_empty")) + '</div>';
          return;
        }

        el.inboxSlots.innerHTML = state.sessions.map((session, index) => {
          const isActive = session.inbox.token === state.activeToken;
          const messageCount = session.messages.length;
          return \`
            <div class="inbox-slot \${isActive ? "active" : ""}" data-action="select" data-token="\${session.inbox.token}">
              <div class="slot-head">
                <span class="slot-tag">\${escapeHtml(formatInboxLabel(index + 1))}</span>
                <span class="slot-count">\${escapeHtml(formatMailCount(messageCount))}</span>
              </div>
              <div class="address">\${escapeHtml(session.inbox.emailAddress)}</div>
              <div class="slot-actions">
                <button class="secondary" type="button" data-action="copy" data-token="\${session.inbox.token}">\${escapeHtml(t("copy_btn"))}</button>
                <button class="ghost" type="button" data-action="delete" data-token="\${session.inbox.token}">\${escapeHtml(t("delete_btn"))}</button>
              </div>
            </div>
          \`;
        }).join("");
      }

      function renderMessages() {
        const session = getActiveSession();

        if (!session) {
          el.messageList.innerHTML = '<div class="empty">' + escapeHtml(t("empty_list_initial")) + '</div>';
          el.messageView.innerHTML = '<div class="empty">' + escapeHtml(t("empty_view_initial")) + '</div>';
          return;
        }

        if (!session.messages.length) {
          el.messageList.innerHTML = '<div class="empty">' + escapeHtml(t("empty_inbox")) + '</div>';
          el.messageView.innerHTML = '<div class="empty">' + escapeHtml(t("empty_inbox")) + '</div>';
          return;
        }

        el.messageList.innerHTML = session.messages.map((message) => {
          const active = session.selectedMessageId === message.id ? "active" : "";
          return \`<button class="message-item \${active}" data-id="\${message.id}">
            <strong>\${escapeHtml(message.subject)}</strong>
            <span>\${escapeHtml(message.from)}</span>
            <span>\${new Date(message.receivedAt).toLocaleString()}</span>
          </button>\`;
        }).join("");

        if (!session.selectedMessageId) {
          el.messageView.innerHTML = '<div class="empty">' + escapeHtml(t("empty_select_message")) + '</div>';
        }

        document.querySelectorAll(".message-item").forEach((button) => {
          button.addEventListener("click", () => loadMessage(button.getAttribute("data-id")));
        });
      }

      async function loadMessage(messageId) {
        const session = getActiveSession();
        if (!session || !messageId) return;

        session.selectedMessageId = messageId;
        renderMessages();
        el.messageView.innerHTML = '<div class="empty">' + escapeHtml(t("loading_message")) + '</div>';

        try {
          const response = await fetch(\`/api/messages/\${messageId}?token=\${session.inbox.token}\`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || t("load_failed"));

          const message = data.message;
          const attachments = (message.attachments || []).map((item) =>
            \`<a href="/api/messages/\${message.id}/attachments/\${item.id}?token=\${session.inbox.token}" target="_blank" rel="noreferrer">\${escapeHtml(item.filename)} (\${formatBytes(item.sizeBytes)})</a>\`
          ).join("");
          const bodyContent = message.html
            ? '<div class="message-frame"><iframe sandbox="" srcdoc="' + escapeAttribute(message.html) + '"></iframe></div>'
            : '<pre>' + escapeHtml(message.text || t("plain_fallback")) + '</pre>';

          el.messageView.innerHTML = \`
            <div>
              <h2 style="margin:0 0 6px">\${escapeHtml(message.subject)}</h2>
            </div>
            \${attachments ? '<div class="attachments">' + attachments + '</div>' : ''}
            \${bodyContent}
          \`;
        } catch (error) {
          el.messageView.innerHTML = '<div class="empty">' + escapeHtml(error.message || t("load_failed")) + '</div>';
        }
      }

      async function refreshSession(session, loadLatest = true, silent = false) {
        if (!session) return;

        const isActive = session.inbox.token === state.activeToken;
        if (!silent && isActive) {
          setRefreshing(true);
        }

        try {
          const response = await fetch(\`/api/session/messages?token=\${session.inbox.token}\`);
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || t("refresh_failed"));
          }

          const nextMessages = data.messages || [];
          const nextSignature = getMessageSignature(nextMessages);
          const signatureChanged = nextSignature !== session.messageSignature;
          const selectedStillExists = session.selectedMessageId
            ? nextMessages.some((item) => item.id === session.selectedMessageId)
            : false;

          session.inbox = { ...session.inbox, ...data.inbox, token: session.inbox.token };
          session.messages = nextMessages;
          session.messageSignature = nextSignature;
          renderInboxSlots();

          if (isActive && signatureChanged) {
            renderMessages();
          }

          if (silent) {
            if (isActive && session.selectedMessageId && !selectedStillExists) {
              session.selectedMessageId = null;
              renderMessages();
              el.messageView.innerHTML = '<div class="empty">' + escapeHtml(t("message_missing")) + '</div>';
            }
            return;
          }

          if (!isActive) {
            return;
          }

          if (loadLatest && session.messages.length && !session.selectedMessageId) {
            await loadMessage(session.messages[0].id);
          } else if (session.selectedMessageId && selectedStillExists) {
            await loadMessage(session.selectedMessageId);
          } else if (session.selectedMessageId && !selectedStillExists) {
            session.selectedMessageId = null;
            renderMessages();
            el.messageView.innerHTML = '<div class="empty">' + escapeHtml(t("message_missing")) + '</div>';
          }
        } finally {
          if (!silent && isActive) {
            setRefreshing(false);
          }
        }
      }

      async function refreshActiveInbox(loadLatest = false, silent = false) {
        const session = getActiveSession();
        if (!session) return;
        await refreshSession(session, loadLatest, silent);
      }

      async function restoreSessions() {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) {
          return;
        }

        let snapshot;
        try {
          snapshot = JSON.parse(raw);
        } catch {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }

        const tokens = Array.isArray(snapshot?.tokens)
          ? snapshot.tokens.filter((token) => typeof token === "string").slice(0, MAX_INBOXES)
          : [];

        if (!tokens.length) {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }

        const restored = [];

        for (const token of tokens) {
          try {
            const response = await fetch(\`/api/session/messages?token=\${encodeURIComponent(token)}\`);
            const data = await response.json();
            if (!response.ok) {
              continue;
            }

            restored.push({
              inbox: { ...data.inbox, token },
              messages: data.messages || [],
              selectedMessageId: null,
              messageSignature: getMessageSignature(data.messages || [])
            });
          } catch {
            continue;
          }
        }

        state.sessions = restored;
        state.activeToken = restored.some((session) => session.inbox.token === snapshot?.activeToken)
          ? snapshot.activeToken
          : restored[0]?.inbox.token || null;

        renderInboxSlots();
        renderMessages();

        if (state.sessions.length) {
          startPolling();
          persistSessionSnapshot();
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }

      async function createInbox(aliasOverride = null) {
        if (state.sessions.length >= MAX_INBOXES) {
          setStatus(t("max_inboxes"), true);
          return;
        }

        const alias = (aliasOverride ?? el.alias.value).trim();
        if (!alias) {
          setStatus(t("enter_alias"), true);
          return;
        }

        setStatus(t("creating"));
        const response = await fetch("/api/inboxes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ alias })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(getApiErrorMessage(data, "create_failed"));

        const session = {
          inbox: data.inbox,
          messages: [],
          selectedMessageId: null,
          messageSignature: ""
        };

        state.sessions.unshift(session);
        state.activeToken = session.inbox.token;
        persistSessionSnapshot();
        renderInboxSlots();
        renderMessages();
        startPolling();
        await refreshSession(session, true, true);
        el.alias.value = "";
        renderAliasPreview();
        persistSessionSnapshot();
        renderMessages();
        setStatus(t("create_success"));
      }

      async function deleteInbox(token = state.activeToken) {
        const session = getSession(token);
        if (!session) {
          setStatus(t("delete_missing"), true);
          return;
        }

        const response = await fetch(\`/api/session?token=\${session.inbox.token}\`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || t("delete_failed"));

        state.sessions = state.sessions.filter((item) => item.inbox.token !== session.inbox.token);

        if (state.activeToken === session.inbox.token) {
          state.activeToken = state.sessions[0]?.inbox.token || null;
        }

        persistSessionSnapshot();
        renderInboxSlots();
        renderMessages();

        if (!state.sessions.length) {
          stopPolling();
        }

        setStatus(t("delete_success"));
      }

      function startPolling() {
        stopPolling();
        state.polling = setInterval(() => {
          Promise.all(state.sessions.map((session) => refreshSession(session, false, true)))
            .catch((error) => setStatus(error.message || t("polling_failed"), true));
        }, 10000);
      }

      function stopPolling() {
        if (state.polling) {
          clearInterval(state.polling);
          state.polling = null;
        }
      }

      function scheduleCloseForAllSessions() {
        const tokens = state.sessions.map((session) => session.inbox.token);
        if (!tokens.length) {
          return;
        }

        for (const token of tokens) {
          navigator.sendBeacon?.(\`/api/session/close?token=\${encodeURIComponent(token)}\`);
        }
      }

      el.createBtn.addEventListener("click", () => createInbox().catch((error) => setStatus(error.message || t("create_failed"), true)));
      el.randomBtn.addEventListener("click", () => {
        if (state.sessions.length >= MAX_INBOXES) {
          setStatus(t("max_inboxes"), true);
          return;
        }
        const alias = generateRandomAlias();
        el.alias.value = alias;
        renderAliasPreview();
        createInbox(alias).catch((error) => setStatus(error.message || t("create_failed"), true));
      });
      el.refreshBtn.addEventListener("click", () => refreshActiveInbox(false, false).then(() => setStatus(t("refresh_success"))).catch((error) => setStatus(error.message || t("refresh_failed"), true)));

      el.inboxSlots.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const { action, token } = button.dataset;
        if (!token) return;

        if (action === "select") {
          state.activeToken = token;
          persistSessionSnapshot();
          renderInboxSlots();
          renderMessages();
          const session = getActiveSession();
          if (session && !session.messages.length) {
            await refreshSession(session, true, true);
            renderMessages();
          } else if (session?.selectedMessageId) {
            await loadMessage(session.selectedMessageId);
          }
          return;
        }

        if (action === "copy") {
          const session = getSession(token);
          if (!session?.inbox?.emailAddress) {
            setStatus(t("create_first"), true);
            return;
          }
          await navigator.clipboard.writeText(session.inbox.emailAddress);
          setStatus(t("created_copy_success"));
          return;
        }

        if (action === "delete") {
          deleteInbox(token).catch((error) => setStatus(error.message || t("delete_failed"), true));
        }
      });

      el.alias.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          createInbox().catch((error) => setStatus(error.message || t("create_failed"), true));
        }
      });

      el.alias.addEventListener("input", renderAliasPreview);

      window.addEventListener("pagehide", (event) => {
        if (event.persisted) return;
        if (performance.getEntriesByType("navigation")[0]?.type === "reload") return;
        scheduleCloseForAllSessions();
      });

      state.locale = INITIAL_LOCALE || detectLocale();
      applyLocale();
      restoreSessions().finally(() => {
        renderAliasPreview();
        renderInboxSlots();
        renderMessages();
      });
    </script>`;
}
