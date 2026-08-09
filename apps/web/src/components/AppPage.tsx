import { useStore, useStoreCtx } from "../lib/store";
import { t, useLocale } from "../lib/i18n";
import { loadSampleData } from "../lib/sample-data";
import { useAppState } from "./use-app-state";
import {
  Button,
  ChildFormModal,
  ChildInfoCard,
  ChildTabs,
  DoseModal,
  ListView,
  Onboarding,
  ScheduleTable,
} from "./index";

/** Main screen: child tabs, onboarding, child info, schedule, dose modal. */
export function AppPage() {
  const store = useStoreCtx();
  const { messages } = useLocale();
  const app = useAppState(store);

  const saveChild = async (input: {
    name: string;
    dateOfBirth: string;
    sex?: "male" | "female" | undefined;
  }) => {
    if (app.childForm.childId) {
      await store.updateChild(app.childForm.childId, input);
    } else {
      const row = await store.upsertChild(input);
      app.selectChild(row.childId);
    }
    app.setChildForm({ open: false });
    app.setWindowStart(null);
  };

  const deleteChild = async (childId: string) => {
    if (!window.confirm(t(messages, "confirmDeleteChild"))) return;
    await store.deleteChild(childId);
    const remaining = store
      .getSnapshot()
      .children.filter((c) => !c.deleted);
    if (remaining.length > 0) app.selectChild(remaining[0]!.childId);
    app.setChildForm({ open: false });
    app.setWindowStart(null);
  };

  const saveRecord = async (input: {
    givenDate: string;
    brand?: string | undefined;
    note?: string | undefined;
  }) => {
    if (!app.openDoseInfo) return;
    await store.upsertRecord({
      childId: app.openDoseInfo.child.childId,
      doseId: app.openDoseInfo.dose.doseId,
      ...input,
    });
    app.setDoseId(null);
  };

  const deleteRecord = async (recordId: string) => {
    if (!window.confirm(t(messages, "confirmDeleteRecord"))) return;
    await store.deleteRecord(recordId);
    app.setDoseId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <ChildTabs
        children={app.children}
        activeChildId={app.activeChildId}
        onSelect={app.selectChild}
        onAdd={() => app.setChildForm({ open: true })}
      />

      {!app.child ? (
        <Onboarding
          onAdd={() => app.setChildForm({ open: true })}
          onSample={() => void loadSampleData(store).then(app.selectChild)}
        />
      ) : (
        <>
          <ChildInfoCard
            child={app.child}
            records={app.records}
            onEdit={() =>
              app.setChildForm({ open: true, childId: app.child!.childId })
            }
            onDelete={() => void deleteChild(app.child!.childId)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">
              {t(messages, "scheduleTitle")}
            </h2>
            <span className="text-sm text-slate-400">
              {t(messages, "scheduleSubtitle")}
            </span>
            <div className="ml-auto flex gap-1 rounded-lg border border-slate-700 p-0.5">
              <button
                type="button"
                className={`rounded px-2 py-1 text-xs ${
                  app.view === "table"
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-300"
                }`}
                data-testid="view-table"
                onClick={() => app.switchView("table")}
              >
                {t(messages, "tableView")}
              </button>
              <button
                type="button"
                className={`rounded px-2 py-1 text-xs ${
                  app.view === "list"
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-300"
                }`}
                data-testid="view-list"
                onClick={() => app.switchView("list")}
              >
                {t(messages, "listView")}
              </button>
            </div>
          </div>
          {app.view === "table" ? (
            <ScheduleTable
              child={app.child}
              records={app.records}
              windowStart={app.windowStart}
              onWindowStartChange={app.setWindowStart}
              onOpenDose={(vaccineId, doseId) =>
                app.openDose(app.child!.childId, doseId)
              }
            />
          ) : (
            <ListView
              child={app.child}
              records={app.records}
              onOpenDose={(vaccineId, doseId) =>
                app.openDose(app.child!.childId, doseId)
              }
            />
          )}
          <p className="text-xs text-slate-400">{t(messages, "footerNote")}</p>
        </>
      )}

      {app.childForm.open && (
        <ChildFormModal
          child={app.children.find((c) => c.childId === app.childForm.childId)}
          onClose={() => app.setChildForm({ open: false })}
          onSave={(input) => void saveChild(input)}
        />
      )}

      {app.openDoseInfo && (
        <DoseModal
          child={app.openDoseInfo.child}
          vaccineId={app.openDoseInfo.vaccine.id}
          doseId={app.openDoseInfo.dose.doseId}
          record={app.openDoseInfo.record}
          status={app.openDoseInfo.status}
          childAgeMonths={app.openDoseInfo.childAgeMonths}
          onClose={() => app.setDoseId(null)}
          onSave={(input) => void saveRecord(input)}
          onDelete={(recordId) => void deleteRecord(recordId)}
        />
      )}
    </div>
  );
}
