export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttribute(input: string): string {
  return input.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

export function escapeHeaderValue(input: string): string {
  return input.replaceAll('"', "");
}
