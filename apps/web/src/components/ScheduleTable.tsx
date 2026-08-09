import type { ChildRow, RecordRow } from "@app/local-first";
import { t, useLocale } from "../lib/i18n";
import { AGE_COLUMNS, SCHEDULE } from "../lib/schedule";
import { ageFocusStart, ageMonths, doseStatus, WINDOW_PREV, WINDOW_SHIFT, WINDOW_SIZE } from "../lib/status";
import { Button } from "./ui";

const STATUS_CLASS = {
  done: "status-done",
  overdue: "status-overdue",
  due: "status-due",
  upcoming: "status-upcoming",
} as const;

/**
 * The signature IDAI 2024 dense table (ADR-004): 18 vaccines × a window of
 * 11 age columns, sticky vaccine column and age header, color-coded cells
 * with status outlines. Prev/next/back-to-now navigation.
 */
export function ScheduleTable({
  child,
  records,
  windowStart,
  onWindowStartChange,
  onOpenDose,
}: {
  child: ChildRow;
  records: RecordRow[];
  windowStart: number | null;
  onWindowStartChange: (start: number | null) => void;
  onOpenDose: (vaccineId: string, doseId: string) => void;
}) {
  const { locale, messages } = useLocale();
  const start = windowStart ?? ageFocusStart(child);
  const endIdx = Math.min(start + WINDOW_SIZE, AGE_COLUMNS.length) - 1;
  const focused = start === ageFocusStart(child);
  const cols = AGE_COLUMNS.slice(start, start + WINDOW_SIZE);
  const age = ageMonths(child.dateOfBirth);
  let currentCol = -1;
  AGE_COLUMNS.forEach((c, i) => {
    if (c.months <= age) currentCol = i;
  });

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <Button
          variant="ghost"
          disabled={start === 0}
          data-testid="cols-prev"
          onClick={() => onWindowStartChange(Math.max(0, start - WINDOW_SHIFT))}
        >
          ‹ {t(messages, "prevCols")}
        </Button>
        <span className="text-slate-400">
          {cols[0]?.label[locale]} – {cols[cols.length - 1]?.label[locale]}
        </span>
        <Button
          variant="ghost"
          disabled={endIdx >= AGE_COLUMNS.length - 1}
          data-testid="cols-next"
          onClick={() =>
            onWindowStartChange(
              Math.min(start + WINDOW_SHIFT, AGE_COLUMNS.length - WINDOW_SIZE),
            )
          }
        >
          {t(messages, "nextCols")} ›
        </Button>
        {!focused && (
          <Button
            variant="ghost"
            data-testid="cols-now"
            onClick={() => onWindowStartChange(null)}
          >
            {t(messages, "backToNow")}
          </Button>
        )}
      </div>
      <div
        className="schedule-grid overflow-x-auto rounded-lg border border-slate-800"
        style={{
          gridTemplateColumns: `190px repeat(${cols.length}, minmax(62px, 1fr))`,
        }}
        data-testid="schedule-table"
      >
        <div className="cell corner sticky-left sticky-top">
          {t(messages, "vaccineCol")} / {t(messages, "ageCol")}
        </div>
        {cols.map((c) => {
          const i = start + cols.indexOf(c);
          return (
            <div
              key={c.months}
              className={`cell col-header sticky-top ${i === currentCol ? "current-col" : ""}`}
            >
              {c.label[locale]}
            </div>
          );
        })}
        {SCHEDULE.map((vaccine) => (
          <ScheduleRow
            key={vaccine.id}
            vaccineId={vaccine.id}
            color={vaccine.color}
            name={vaccine.name[locale]}
            cols={cols}
            start={start}
            currentCol={currentCol}
            child={child}
            records={records}
            onOpenDose={onOpenDose}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {t(messages, "clickCellHint")}
      </p>
    </div>
  );
}

function ScheduleRow({
  vaccineId,
  color,
  name,
  cols,
  start,
  currentCol,
  child,
  records,
  onOpenDose,
}: {
  vaccineId: string;
  color: string;
  name: string;
  cols: { months: number }[];
  start: number;
  currentCol: number;
  child: ChildRow;
  records: RecordRow[];
  onOpenDose: (vaccineId: string, doseId: string) => void;
}) {
  const vaccine = SCHEDULE.find((v) => v.id === vaccineId);
  if (!vaccine) return null;
  const doseMap = new Map(vaccine.doses.map((d) => [d.months, d]));

  return (
    <>
      <div
        className="cell row-label sticky-left"
        style={{ background: color }}
      >
        {name}
      </div>
      {cols.map((c) => {
        const i = start + cols.indexOf(c);
        const dose = doseMap.get(c.months);
        if (!dose) {
          return (
            <div
              key={c.months}
              className={`cell empty ${i === currentCol ? "current-col" : ""}`}
            />
          );
        }
        const record = records.find(
          (r) => r.childId === child.childId && r.doseId === dose.doseId,
        );
        const status = doseStatus(child, dose, record);
        return (
          <button
            key={c.months}
            type="button"
            className={`cell dose ${STATUS_CLASS[status]} ${i === currentCol ? "current-col" : ""}`}
            style={{ background: color }}
            data-testid={`cell-${dose.doseId}`}
            onClick={() => onOpenDose(vaccineId, dose.doseId)}
          >
            <span className="dose-label">{dose.code}</span>
            {status === "done" && <span className="done-check">✓</span>}
          </button>
        );
      })}
    </>
  );
}
