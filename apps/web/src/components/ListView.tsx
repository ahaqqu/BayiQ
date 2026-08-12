import type { ChildRow, RecordRow } from "@app/local-first";
import { t, useLocale } from "../lib/i18n";
import { ageColumnLabel, SCHEDULE } from "../lib/schedule";
import { doseStatus, findRecord } from "../lib/status";
import { StatusBadge } from "./index";

/** List/card view of the schedule (ADR-004): one card per vaccine. */
export function ListView({
  child,
  records,
  onOpenDose,
}: {
  child: ChildRow;
  records: RecordRow[];
  onOpenDose: (vaccineId: string, doseId: string) => void;
}) {
  const { locale, messages } = useLocale();

  return (
    <div className="flex flex-col gap-3" data-testid="schedule-list">
      {SCHEDULE.map((vaccine) => (
        <div
          key={vaccine.id}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
        >
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: vaccine.color }}
            />
            {t(messages, vaccine.nameKey)}
          </h3>
          <div className="flex flex-col gap-1">
            {vaccine.doses.map((dose) => {
              const record = findRecord(records, child.childId, dose.doseId);
              const status = doseStatus(child, dose, record);
              const ageLabel = ageColumnLabel(messages, locale, dose.months);
              return (
                <button
                  key={dose.doseId}
                  type="button"
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-800"
                  data-testid={`list-${dose.doseId}`}
                  onClick={() => onOpenDose(vaccine.id, dose.doseId)}
                >
                  <span className="w-20 shrink-0 font-medium">
                    {dose.code}
                  </span>
                  <span className="w-16 shrink-0 text-slate-400">
                    {ageLabel}
                  </span>
                  <StatusBadge status={status} />
                  {record && (
                    <span className="ml-auto text-xs text-slate-500">
                      {record.givenDate}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
