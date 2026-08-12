import { useEffect, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import {
  LocaleCtx,
  loadLocalePref,
  loadMessages,
  saveLocalePref,
  t,
  type Locale,
  type Messages,
} from "../lib/i18n";
import { useStore, useStoreCtx } from "../lib/store";
import { NotificationsBell, SwUpdatePrompt, useSync } from "./index";

/**
 * App shell: owns the selected locale and the top bar (language toggle,
 * notification bell, sync status). The SW update prompt renders inside the
 * locale provider so its copy follows the language switch.
 */
export function Shell() {
  const store = useStoreCtx();
  const state = useStore(store);
  const syncStatus = useSync(store);
  const [locale, setLocale] = useState<Locale>(() => loadLocalePref());
  const [messages, setMessages] = useState<Messages>({});

  useEffect(() => {
    document.documentElement.lang = locale;
    void loadMessages(locale)
      .then(setMessages)
      .catch(() => {
        /* offline first launch: keys fall back until the next load */
      });
  }, [locale]);

  const switchLocale = (next: Locale) => {
    setLocale(next);
    saveLocalePref(next);
  };

  return (
    <LocaleCtx.Provider value={{ locale, messages }}>
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-sky-400">
            {t(messages, "appTitle")}
          </h1>
          <span className="hidden text-sm text-slate-400 sm:inline">
            {t(messages, "tagline")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="text-xs text-slate-400"
              data-testid="sync-status"
            >
              {syncStatus === "syncing" && t(messages, "syncing")}
              {syncStatus === "synced" && t(messages, "synced")}
              {syncStatus === "offline" && t(messages, "offline")}
              {syncStatus === "error" && t(messages, "syncError")}
            </span>
            <NotificationsBell
              children={state.children.filter((c) => !c.deleted)}
              records={state.records.filter((r) => !r.deleted)}
            />
            <button
              type="button"
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300"
              data-testid="lang-toggle"
              onClick={() => switchLocale(locale === "id" ? "en" : "id")}
            >
              {t(messages, "langLabel")}
            </button>
          </div>
        </header>
        <Outlet />
        <SwUpdatePrompt />
      </div>
    </LocaleCtx.Provider>
  );
}
