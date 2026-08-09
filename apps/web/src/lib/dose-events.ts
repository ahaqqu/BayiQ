/**
 * Cross-component bridge: the notification bell (header) must open a dose
 * modal owned by the schedule screen (outlet). A tiny module-level emitter
 * keeps the two decoupled without prop drilling through the router.
 */
export type DoseOpenEvent = {
  childId: string;
  doseId: string;
};

const listeners = new Set<(e: DoseOpenEvent) => void>();

export function onOpenDose(fn: (e: DoseOpenEvent) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitOpenDose(e: DoseOpenEvent): void {
  for (const fn of listeners) fn(e);
}
