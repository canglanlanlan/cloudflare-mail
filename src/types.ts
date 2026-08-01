export interface Env {
  DB: D1Database;
  ATTACHMENTS?: R2Bucket;
  INBOX_DOMAIN: string;
  DEFAULT_TTL_HOURS?: string;
  MAX_ATTACHMENT_BYTES?: string;
  ADMIN_PASSWORD?: string;
}

export type InboxRow = {
  id: string;
  slug: string;
  email_local: string;
  token: string;
  created_at: string;
  expires_at: string;
  last_message_at: string | null;
};

export type MessageRow = {
  id: string;
  inbox_id: string;
  message_id: string | null;
  from_name: string | null;
  from_address: string;
  to_address: string;
  subject: string | null;
  text_content: string | null;
  html_content: string | null;
  received_at: string;
  size_bytes: number;
  has_attachments: number;
};

export type AttachmentRow = {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  r2_key: string;
};

export type AdminStats = {
  uniqueUsers: number;
  inboxesCreated: number;
  emailsReceived: number;
  unclaimedEmails: number;
  dayLabel: string;
  visits: Array<{
    firstSeenAt: string;
    ipHashShort: string;
  }>;
  trend: Array<{
    dayKey: string;
    uniqueUsers: number;
    inboxesCreated: number;
    emailsReceived: number;
    unclaimedEmails: number;
  }>;
  reservedAliases: string[];
};

export type SiteLocale = "zh" | "en";
