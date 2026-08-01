import type { Env } from "./types";
import { clampNumber } from "./utils-math";

export function getActiveExpiry(now: Date): Date {
  return new Date(now.getTime() + 10 * 60 * 1000);
}

export function getPendingExpiry(now: Date, env: Env): Date {
  const hours = clampNumber(Number(env.DEFAULT_TTL_HOURS ?? 1), 1, 1);
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export function getClosedExpiry(now: Date): Date {
  return new Date(now.getTime() + 10 * 60 * 1000);
}

export function getMessageRetentionCutoff(now: Date, env: Env): Date {
  const hours = clampNumber(Number(env.DEFAULT_TTL_HOURS ?? 1), 1, 1);
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

export function getShanghaiDayInfo(now: Date) {
  const offsetMs = 8 * 60 * 60 * 1000;
  const shifted = new Date(now.getTime() + offsetMs);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const startMs = Date.UTC(year, month - 1, day) - offsetMs;
  const endMs = startMs + 24 * 60 * 60 * 1000;
  const dayKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    dayKey,
    label: `${dayKey} (Asia/Shanghai)`,
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString()
  };
}
