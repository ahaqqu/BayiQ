import { useEffect, useRef, useState } from "react";
import type { ChildRow, RecordRow } from "@app/local-first";
import { computeNotifications } from "../lib/status";
import { t, useLocale } from "../lib/i18n";
import { emitOpenDose } from "../lib/dose-events";

const KIND_KEY = {
  overdue: "notifOverdue",
  due: "notifDue",
  upcoming: "notifUpcoming",
} as const;

/**
 * Notification bell: badge count of overdue/due/upcoming doses across all
 * children, panel grouped by child. Clicking an item focuses the dose via
 * the dose-open bridge.
 */
export function NotificationsBell({
  children,
  records,
}: {
  children: ChildRow[];
  records: RecordRow[];
}) {
  const { locale, messages } = useLocale();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const items = computeNotifications(children, records);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const byChild = new Map<string, typeof items>();
  for (const item of items) {
    const list = byChild.get(item.child.childId) ?? [];
    list.push(item);
    byChild.set(item.child.childId, list);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative rounded border border-slate-700 px-2 py-1 text-sm text-slate-300"
        data-testid="notif-bell"
        aria-label={t(messages, "notifications")}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        🔔
        {items.length > 0 && (
          <span
            className="absolute -top-2 -right-2 rounded-full bg-rose-500 px-1.5 text-xs text-slate-950"
            data-testid="notif-badge"
          >
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 z-30 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl"
          data-testid="notif-panel"
        >
          {items.length === 0 ? (
            <p className="text-sm text-slate-400">
              {t(messages, "noNotifications")}
            </p>
          ) : (
            [...byChild.entries()].map(([childId, childItems]) => {
              const child = children.find((c) => c.childId === childId);
              if (!child) return null;
              return (
                <div key={childId} className="mb-2 last:mb-0">
                  <h4 className="mb-1 text-sm font-semibold text-slate-200">
                    {child.name}
                  </h4>
                  {childItems.map((item) => (
                    <button
                      key={item.dose.doseId}
                      type="button"
                      className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-800"
                      data-testid={`notif-item-${item.dose.doseId}`}
                      onClick={() => {
                        setOpen(false);
                        emitOpenDose({
                          childId: child.childId,
                          doseId: item.dose.doseId,
                        });
                      }}
                    >
                      <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: item.vaccine.color }}
                      />
                      <span className="text-slate-300">
                        <strong>
                          {item.vaccine.name[locale]} {item.dose.code}
                        </strong>{" "}
                        {t(messages, KIND_KEY[item.kind])}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
