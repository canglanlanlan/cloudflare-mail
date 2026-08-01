import type { Env } from "./types";

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createPendingToken(): string {
  return `PENDING_${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export function isPendingToken(token: string): boolean {
  return token.startsWith("PENDING_");
}

export async function generateAccessToken(env: Env): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 6; attempt += 1) {
    let token = "";
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    for (const byte of bytes) {
      token += alphabet[byte % alphabet.length];
    }

    const existing = await env.DB.prepare("SELECT id FROM inboxes WHERE token = ?").bind(token).first<{ id: string }>();
    if (!existing) {
      return token;
    }
  }

  return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}
