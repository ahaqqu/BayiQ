import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { ageFocusForMonths, ageMonths, doseStatus, findRecord } from "../lib/status";
import { findDoseById } from "../lib/schedule";
import { onOpenDose } from "../lib/dose-events";

export type View = "table" | "list";

const VIEW_KEY = "bayiq.view";

function loadView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "table";
  } catch {
    return "table";
  }
}

export type ChildFormState = { open: boolean; childId?: string | undefined };

/**
 * Schedule-screen state: active child, column window, view toggle, and the
 * open modals. Owns the dose-open bridge from the notification bell.
 */
export function useAppState(store: Parameters<typeof useStore>[0]) {
  const state = useStore(store);
  const children = state.children.filter((c) => !c.deleted);
  const records = state.records.filter((r) => !r.deleted);

  const [activeChildId, setActiveChildId] = useState<string | null>(
    children[0]?.childId ?? null,
  );
  const [windowStart, setWindowStart] = useState<number | null>(null);
  const [view, setView] = useState<View>(loadView);
  const [childForm, setChildForm] = useState<ChildFormState>({ open: false });
  const [doseId, setDoseId] = useState<string | null>(null);

  useEffect(
    () =>
      onOpenDose((e) => {
        setActiveChildId(e.childId);
        const found = findDoseById(e.doseId);
        if (found) {
          setWindowStart(ageFocusForMonths(found.dose.months));
        }
        setDoseId(e.doseId);
      }),
    [],
  );

  // Fall back to the first remaining child when the active one is deleted.
  const effectiveChildId =
    children.some((c) => c.childId === activeChildId)
      ? activeChildId
      : (children[0]?.childId ?? null);
  const child = children.find((c) => c.childId === effectiveChildId) ?? null;

  const openDoseInfo = useMemo(() => {
    if (!doseId || !child) return null;
    const found = findDoseById(doseId);
    if (!found) return null;
    const record = findRecord(records, child.childId, doseId);
    return {
      child,
      vaccine: found.vaccine,
      dose: found.dose,
      record,
      status: doseStatus(child, found.dose, record),
      childAgeMonths: ageMonths(child.dateOfBirth),
    };
  }, [doseId, child, records]);

  const openDose = (childId: string, doseId: string) => {
    setActiveChildId(childId);
    setDoseId(doseId);
  };

  const selectChild = (childId: string) => {
    setActiveChildId(childId);
    setWindowStart(null);
  };

  const switchView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return {
    children,
    records,
    child,
    activeChildId: effectiveChildId,
    windowStart,
    view,
    childForm,
    openDoseInfo,
    setWindowStart,
    setChildForm,
    setDoseId,
    openDose,
    selectChild,
    switchView,
  };
}
