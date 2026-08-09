import { formatAge, t, useLocale } from "../lib/i18n";
import { ageMonths } from "../lib/status";
import { Button } from "./ui";

/** Child tab row: one tab per child plus the add button. */
export function ChildTabs({
  children,
  activeChildId,
  onSelect,
  onAdd,
}: {
  children: { childId: string; name: string; dateOfBirth: string }[];
  activeChildId: string | null;
  onSelect: (childId: string) => void;
  onAdd: () => void;
}) {
  const { locale, messages } = useLocale();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="child-tabs">
      {children.map((c) => (
        <button
          key={c.childId}
          type="button"
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
            c.childId === activeChildId
              ? "border-sky-500 bg-sky-500/10 text-sky-300"
              : "border-slate-700 text-slate-300 hover:bg-slate-800"
          }`}
          data-testid={`child-tab-${c.childId}`}
          onClick={() => onSelect(c.childId)}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs">
            {c.name[0]?.toUpperCase()}
          </span>
          <span className="flex flex-col items-start leading-tight">
            <strong>{c.name}</strong>
            <small className="text-xs text-slate-400">
              {formatAge(messages, ageMonths(c.dateOfBirth))}
            </small>
          </span>
        </button>
      ))}
      <Button variant="ghost" data-testid="add-child-tab" onClick={onAdd}>
        + {t(messages, "addChild")}
      </Button>
    </div>
  );
}
