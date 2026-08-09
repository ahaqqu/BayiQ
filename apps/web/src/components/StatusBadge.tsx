import { t, useLocale } from "../lib/i18n";
import type { DoseStatus } from "../lib/status";

const STATUS_KEY = {
  done: "statusDone",
  overdue: "statusOverdue",
  due: "statusDue",
  upcoming: "statusUpcoming",
} as const;

const STATUS_CLASS = {
  done: "bg-emerald-500/20 text-emerald-300",
  overdue: "bg-rose-500/20 text-rose-300",
  due: "bg-amber-500/20 text-amber-300",
  upcoming: "bg-slate-600/40 text-slate-300",
} as const;

/** Shared status pill used by the list view and the dose modal. */
export function StatusBadge({ status }: { status: DoseStatus }) {
  const { messages } = useLocale();
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[status]}`}
      data-testid="dose-status"
    >
      {t(messages, STATUS_KEY[status])}
    </span>
  );
}
