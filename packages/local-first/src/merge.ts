/**
 * LWW-element-set merge for BayiQ rows (ADR-003, ADR-007). Children and
 * records are merged independently with the same rules: newer `updatedAt`
 * wins, exact-timestamp ties break on a deterministic payload key, and a
 * delete always wins once seen. Output rows normalize `deleted` to
 * `true | undefined` so merge is input-representation independent.
 */

export type ChildRow = {
  childId: string;
  name: string;
  dateOfBirth: string;
  sex?: "male" | "female" | undefined;
  updatedAt: number;
  deleted?: boolean | undefined;
};

export type RecordRow = {
  recordId: string;
  childId: string;
  doseId: string;
  givenDate: string;
  brand?: string | undefined;
  note?: string | undefined;
  updatedAt: number;
  deleted?: boolean | undefined;
};

export type BayiQState = {
  schemaVersion: number;
  children: ChildRow[];
  records: RecordRow[];
  clockFloor?: number | undefined;
};

type Row = { updatedAt: number; deleted?: boolean | undefined };

/**
 * Winner between two versions of the same row: newer `updatedAt`, then the
 * greater payload key compared element-wise (fixed field order, so the
 * winner is independent of object key order and of JSON serialization
 * artifacts like space-vs-quote ordering).
 */
function win<T extends Row>(a: T, b: T, key: (r: T) => unknown[]): T {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  const ka = key(a);
  const kb = key(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const va = ka[i];
    const vb = kb[i];
    if (va === vb) continue;
    return String(va) > String(vb) ? a : b;
  }
  return a;
}

/**
 * Generic LWW merge over two row sets. `id` extracts the row's identity;
 * `key` selects the payload fields used for deterministic tie-breaking.
 */
export function mergeRows<T extends Row>(
  a: T[],
  b: T[],
  id: (r: T) => string,
  key: (r: T) => unknown[],
): T[] {
  const map = new Map<string, T>();
  for (const raw of [...a, ...b]) {
    const row: T = { ...raw, deleted: raw.deleted === true ? true : undefined };
    const prev = map.get(id(row));
    if (!prev) {
      map.set(id(row), row);
      continue;
    }
    const winner = win(prev, row, key);
    const deleted = prev.deleted === true || row.deleted === true;
    map.set(id(row), { ...winner, deleted: deleted ? true : undefined });
  }
  return [...map.values()];
}

const childKey = (r: ChildRow): unknown[] => [r.name, r.dateOfBirth, r.sex ?? null];

const recordKey = (r: RecordRow): unknown[] => [
  r.childId,
  r.doseId,
  r.givenDate,
  r.brand ?? null,
  r.note ?? null,
];

export function mergeChildren(a: ChildRow[], b: ChildRow[]): ChildRow[] {
  return mergeRows(a, b, (r) => r.childId, childKey);
}

export function mergeRecords(a: RecordRow[], b: RecordRow[]): RecordRow[] {
  return mergeRows(a, b, (r) => r.recordId, recordKey);
}

export function aliveChildren(rows: ChildRow[]): ChildRow[] {
  return rows.filter((r) => !r.deleted);
}

export function aliveRecords(rows: RecordRow[]): RecordRow[] {
  return rows.filter((r) => !r.deleted);
}
