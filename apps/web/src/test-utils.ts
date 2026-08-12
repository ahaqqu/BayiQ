import { vi } from "vitest";

/** Minimal in-memory IndexedDB fake: one store, microtask-async requests. */
export function stubIndexedDB() {
  let data: unknown;
  vi.stubGlobal("indexedDB", {
    open: () => {
      const db = {
        objectStoreNames: { contains: () => false },
        createObjectStore: () => ({}),
        transaction: () => {
          const tx = {
            objectStore: () => ({
              get: () => {
                const req = {
                  result: undefined as unknown,
                  onsuccess: null as null | (() => void),
                  onerror: null as null | (() => void),
                };
                queueMicrotask(() => {
                  req.result = data;
                  req.onsuccess?.();
                });
                return req;
              },
              put: (value: unknown) => {
                data = value;
              },
            }),
            oncomplete: null as null | (() => void),
            onerror: null as null | (() => void),
          };
          queueMicrotask(() => tx.oncomplete?.());
          return tx;
        },
        close: () => {},
      };
      const req = {
        result: db,
        onsuccess: null as null | (() => void),
        onerror: null as null | (() => void),
        onupgradeneeded: null as null | (() => void),
      };
      queueMicrotask(() => req.onsuccess?.());
      return req;
    },
  });
}

/** Minimal in-memory localStorage fake. */
export function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
}
