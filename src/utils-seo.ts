import type { SiteLocale } from "./types";
import { escapeHtml } from "./utils-text";

export function detectRequestLocale(request: Request): SiteLocale {
  const acceptLanguage = request.headers.get("accept-language") || "";
  return /\bzh\b/i.test(acceptLanguage) ? "zh" : "en";
}

export function renderRobotsTxt(origin: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
}

export function renderSitemapXml(origin: string): string {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeHtml(origin)}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
}
