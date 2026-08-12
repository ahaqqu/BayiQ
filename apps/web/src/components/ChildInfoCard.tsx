import { formatAge, t, useLocale } from "../lib/i18n";
import { SCHEDULE } from "../lib/schedule";
import { ageMonths } from "../lib/status";
import { Button, Card } from "./ui";

/** Child info card: name, age, progress toward doses due so far. */
export function ChildInfoCard({
  child,
  records,
  onEdit,
  onDelete,
}: {
  child: { childId: string; name: string; dateOfBirth: string };
  records: { childId: string; doseId: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { locale, messages } = useLocale();
  const age = ageMonths(child.dateOfBirth);
  let dueTotal = 0;
  let doneTotal = 0;
  for (const vaccine of SCHEDULE) {
    for (const dose of vaccine.doses) {
      if (dose.months <= age) {
        dueTotal += 1;
        if (
          records.some(
            (r) => r.childId === child.childId && r.doseId === dose.doseId,
          )
        ) {
          doneTotal += 1;
        }
      }
    }
  }
  const pct = dueTotal ? Math.round((doneTotal / dueTotal) * 100) : 100;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">{child.name}</h2>
          <span className="text-sm text-slate-400">
            {t(messages, "ageNow")}: {formatAge(messages, age)}
          </span>
        </div>
        <div className="min-w-40 flex-1">
          <div className="mb-1 text-xs text-slate-400">
            {doneTotal}/{dueTotal} {t(messages, "progressDone")} ({pct}%)
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" data-testid="edit-child" onClick={onEdit}>
            {t(messages, "editChild")}
          </Button>
          <Button variant="danger" data-testid="delete-child" onClick={onDelete}>
            {t(messages, "delete")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
