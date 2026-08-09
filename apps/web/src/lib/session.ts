import { SessionResponseSchema, type SessionResponse } from "@app/contracts";
import * as v from "valibot";
import { apiFetch } from "./api";

const KEY = "bayiq.session";

export type ClientSession = SessionResponse;

export function loadSession(): ClientSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientSession;
    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(s: ClientSession): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}

/**
 * Create-only session (ADR-006): the client reuses the stored token and only
 * mints a new one when none exists or the stored one is expired.
 */
export async function ensureSession(): Promise<ClientSession> {
  const existing = loadSession();
  if (existing) return existing;
  const res = await apiFetch("/session", { method: "POST" });
  if (!res.ok) throw new Error(`session_${res.status}`);
  const body = v.parse(SessionResponseSchema, await res.json());
  saveSession(body);
  return body;
}
