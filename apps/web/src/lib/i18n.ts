import { createContext, useContext } from "react";

export type Locale = "en" | "id";

export type Messages = Record<string, string>;

const KEY = "bayiq.locale";
const cache = new Map<Locale, Messages>();

export const DEFAULT_LOCALE: Locale = "id";

export function loadLocalePref(): Locale {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === "en" || raw === "id" ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function saveLocalePref(locale: Locale): void {
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* ignore */
  }
}

/**
 * Loads the active locale's messages once at bootstrap (ADR-005). The JSON
 * files live in `public/locales/{id,en}.json` and are precached by the
 * service worker, so this works offline after first launch.
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  const cached = cache.get(locale);
  if (cached) return cached;
  const res = await fetch(`/locales/${locale}.json`);
  if (!res.ok) throw new Error(`locale_${res.status}`);
  const messages = (await res.json()) as Messages;
  cache.set(locale, messages);
  return messages;
}

export function t(messages: Messages, key: string): string {
  return messages[key] ?? key;
}

/**
 * Selected locale and messages, owned by the app shell. Lives here (not in
 * the router) so UI outside the route tree — the SW update prompt — can
 * follow it too.
 */
export const LocaleCtx = createContext<{
  locale: Locale;
  messages: Messages;
}>({ locale: DEFAULT_LOCALE, messages: {} });

export function useLocale(): { locale: Locale; messages: Messages } {
  return useContext(LocaleCtx);
}

export function formatAge(messages: Messages, months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} ${t(messages, "monthsUnit")}`;
  if (m === 0) return `${y} ${t(messages, "yearsUnit")}`;
  return `${y} ${t(messages, "yearsUnit")} ${m} ${t(messages, "monthsUnit")}`;
}
