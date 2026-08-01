import type { SiteLocale } from "./types";

export const APP_FAVICON_HREF =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%231f63ff'/%3E%3Cpath d='M14 20h36a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z' fill='white'/%3E%3Cpath d='m12 24 20 14 20-14' fill='none' stroke='%231f63ff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

export const SITE_COPY: Record<
  SiteLocale,
  {
    pageTitle: string;
    metaKeywords: string;
    metaDescription: string;
    heroTitle: string;
    heroSubtitle: string;
    ogLocale: string;
  }
> = {
  zh: {
    pageTitle: "免费临时邮箱",
    metaKeywords:
      "免费临时邮箱,临时邮箱,一次性邮箱,匿名邮箱,10分钟邮箱,验证码邮箱,temp mail,disposable email",
    metaDescription:
      "免费临时邮箱服务，支持临时邮箱、一次性邮箱、匿名邮箱在线收信。部署后即可创建临时电子邮件地址，实时接收邮件和验证码。",
    heroTitle: "免费临时邮箱",
    heroSubtitle: "免费、快速、公开、安全的临时电子邮件地址。",
    ogLocale: "zh_CN"
  },
  en: {
    pageTitle: "Free Temporary Email",
    metaKeywords:
      "free temporary email,temp mail,disposable email,temporary inbox,receive email online,temporary email address",
    metaDescription:
      "Free temporary email service for disposable inboxes, verification codes, and instant email receiving. Deploy it on your own domain to create temp mail addresses online.",
    heroTitle: "Free Temporary Email",
    heroSubtitle:
      "Free, fast, public, and secure temporary email addresses for instant email and verification code receiving.",
    ogLocale: "en_US"
  }
};

export const ADMIN_COPY = {
  setupTitle: "后台未配置",
  setupHeading: "后台还没有配置好",
  setupBody: "请先为 Worker 设置 ADMIN_PASSWORD，然后再访问后台。",
  loginTitle: "管理后台登录",
  loginHeading: "管理后台",
  loginBody: "输入后台口令后查看今日使用数据。",
  loginPlaceholder: "后台口令",
  loginButton: "登录",
  loginError: "密码不正确。",
  dashboardTitle: "使用统计后台",
  dashboardHeading: "今日使用统计",
  dashboardRefreshHint: "页面每 60 秒自动刷新一次。",
  dashboardLogout: "退出后台",
  uniqueUsers: "今日使用用户数（按 IP 去重）",
  inboxesCreated: "今日申请邮箱数",
  emailsReceived: "今日接收邮件数",
  unclaimedEmails: "今日未认领邮件数",
  unclaimedNote: "“未认领邮件”按邮件到达当时尚未被认领来累计统计，后续邮箱被认领也不会回溯扣减。",
  visitsTableTitle: "今日访问明细",
  visitsFirstSeen: "首次访问时间",
  visitsIpHash: "IP 匿名标识",
  visitsEmpty: "今天还没有访问记录。",
  trendTableTitle: "最近 7 天趋势",
  trendDay: "日期",
  trendUsers: "用户数",
  trendInboxes: "申请邮箱数",
  trendEmails: "接收邮件数",
  trendUnclaimed: "未认领邮件数",
  trendEmpty: "暂时没有趋势数据。",
  reservedAliasesTitle: "保留前缀管理",
  reservedAliasesBody: "这里配置不允许用户创建的邮箱前缀，新增和删除都会立即生效。",
  reservedAliasesPlaceholder: "输入要禁用的邮箱前缀",
  reservedAliasesAdd: "添加前缀",
  reservedAliasesEmpty: "当前还没有保留前缀。",
  reservedAliasesDelete: "删除",
  reservedAliasesSaved: "保留前缀已更新。",
  reservedAliasesSaveFailed: "保留前缀更新失败。"
} as const;

export const UI_TRANSLATIONS = {
  zh: {
    document_title: "免费临时邮箱",
    hero_title: "免费临时邮箱",
    hero_subtitle: "免费、快速、公开、安全的临时电子邮件地址。",
    create_title: "创建邮箱",
    create_subtitle: "当前页面保持打开时，邮箱持续有效。",
    alias_placeholder: "在这里输入邮箱前缀",
    preview_default: "输入前缀后会显示邮箱地址",
    create_btn: "创建临时邮箱",
    random_btn: "随机生成邮箱",
    viewer_title: "收件箱",
    viewer_subtitle: "每 10 秒静默刷新。",
    refresh_aria: "刷新收件箱",
    slot_empty: "最多同时保留两个临时邮箱。",
    inbox_label: "Inbox {index}",
    mail_count: "{count} 封邮件",
    copy_btn: "复制邮箱",
    delete_btn: "删除邮箱",
    empty_list_initial: "先创建一个免费临时邮箱，收到的邮件会显示在这里。",
    empty_view_initial: "左侧最多可同时保留两个临时邮箱，点击卡片即可切换查看邮件内容。",
    empty_inbox: "收件箱还是空的，发一封测试邮件试试。",
    empty_select_message: "选中一封邮件后，这里会显示正文、元信息和附件。",
    loading_message: "正在加载邮件内容...",
    from_label: "发件人",
    to_label: "收件人",
    received_label: "接收时间",
    plain_fallback: "这封邮件没有可读的纯文本正文。",
    load_failed: "加载失败",
    message_missing: "这封邮件已经不在当前收件箱里了。",
    max_inboxes: "最多同时保留两个临时邮箱。",
    create_first: "先创建邮箱。",
    enter_alias: "先输入邮箱前缀，或者使用随机生成。",
    creating: "正在创建邮箱...",
    create_success: "邮箱已创建。现在可以开始收信。",
    invalid_alias: "请输入有效的邮箱前缀，只能包含字母、数字或连字符。",
    reserved_alias: "这个前缀已被保留，请换一个。",
    delete_missing: "当前没有可删除的邮箱。",
    delete_failed: "删除失败",
    delete_success: "邮箱和邮件记录已删除。",
    refresh_success: "收件箱已刷新。",
    refresh_failed: "刷新失败",
    polling_failed: "轮询失败",
    created_copy_success: "邮箱地址已复制。",
    create_failed: "创建失败"
  },
  en: {
    document_title: "Free Temporary Email",
    hero_title: "Free Temporary Email",
    hero_subtitle:
      "Free, fast, public, and secure temporary email addresses for instant email and verification code receiving.",
    create_title: "Create Inbox",
    create_subtitle: "The inbox stays active while this page remains open.",
    alias_placeholder: "Enter email prefix here",
    preview_default: "Type a prefix to preview the email address",
    create_btn: "Create Inbox",
    random_btn: "Random Inbox",
    viewer_title: "Inbox",
    viewer_subtitle: "Silent refresh every 10 seconds.",
    refresh_aria: "Refresh inbox",
    slot_empty: "You can keep up to two temporary inboxes at the same time.",
    inbox_label: "Inbox {index}",
    mail_count: "{count} emails",
    copy_btn: "Copy Email",
    delete_btn: "Delete Inbox",
    empty_list_initial: "Create a free temporary email first and your emails will appear here.",
    empty_view_initial: "You can keep up to two temp inboxes on the left and switch between them.",
    empty_inbox: "This inbox is empty. Send a test email to try it.",
    empty_select_message: "Select an email to view its content, metadata, and attachments.",
    loading_message: "Loading email content...",
    from_label: "From",
    to_label: "To",
    received_label: "Received",
    plain_fallback: "This email does not contain readable plain text.",
    load_failed: "Failed to load",
    message_missing: "This email is no longer available in the current inbox.",
    max_inboxes: "You can keep up to two temporary inboxes.",
    create_first: "Create an inbox first.",
    enter_alias: "Enter a prefix first, or use random generation.",
    creating: "Creating inbox...",
    create_success: "Inbox created. You can start receiving email now.",
    invalid_alias: "Please enter a valid email prefix using letters, numbers, or hyphens.",
    reserved_alias: "This prefix is reserved. Please choose another one.",
    delete_missing: "There is no inbox to delete.",
    delete_failed: "Delete failed",
    delete_success: "Inbox and messages deleted.",
    refresh_success: "Inbox refreshed.",
    refresh_failed: "Refresh failed",
    polling_failed: "Polling failed",
    created_copy_success: "Email address copied.",
    create_failed: "Create failed"
  }
} as const;

export const SITE_FAQ = {
  zh: [
    {
      question: "什么是免费临时邮箱？",
      answer: "免费临时邮箱是一种可快速创建、用于临时接收邮件和验证码的一次性电子邮箱地址。"
    },
    {
      question: "这个临时邮箱可以用来收验证码吗？",
      answer: "可以，部署后可在线接收验证码邮件和普通邮件，并会实时刷新收件箱。"
    },
    {
      question: "临时邮箱会保留多久？",
      answer: "当前页面关闭后 10 分钟邮箱会自动销毁，接收到的邮件只保留 1 小时。"
    }
  ],
  en: [
    {
      question: "What is a free temporary email?",
      answer: "A free temporary email is a disposable inbox that you can create quickly for short-term email and verification code receiving."
    },
    {
      question: "Can this temp mail receive verification codes?",
      answer: "Yes. After deployment, it can receive verification emails and regular emails online with real-time inbox refresh."
    },
    {
      question: "How long does the inbox stay available?",
      answer: "The inbox is destroyed 10 minutes after the page is closed, and received emails are kept for 1 hour."
    }
  ]
} as const;
