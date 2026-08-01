CREATE TABLE IF NOT EXISTS inboxes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  email_local TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_message_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_inboxes_expires_at ON inboxes(expires_at);
CREATE INDEX IF NOT EXISTS idx_inboxes_email_local ON inboxes(email_local);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  inbox_id TEXT NOT NULL,
  message_id TEXT,
  from_name TEXT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  text_content TEXT,
  html_content TEXT,
  received_at TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  has_attachments INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (inbox_id) REFERENCES inboxes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_inbox_received_at ON messages(inbox_id, received_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id) WHERE message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);

CREATE TABLE IF NOT EXISTS daily_visits (
  day_key TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  PRIMARY KEY (day_key, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_daily_visits_first_seen_at ON daily_visits(first_seen_at);

CREATE TABLE IF NOT EXISTS daily_metrics (
  day_key TEXT PRIMARY KEY,
  inboxes_created INTEGER NOT NULL DEFAULT 0,
  emails_received INTEGER NOT NULL DEFAULT 0,
  unclaimed_emails INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reserved_aliases (
  alias TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
