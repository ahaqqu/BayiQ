import { t, useLocale } from "../lib/i18n";

/** Shown while the local store initializes. */
export function Loading() {
  const { messages } = useLocale();
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">
      {t(messages, "loading")}
    </div>
  );
}
