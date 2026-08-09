import { useEffect, useState } from "react";
import { BayiQStore } from "../lib/store";

/** Creates the local-first store once at bootstrap. */
export function useStoreInit(): BayiQStore | null {
  const [store, setStore] = useState<BayiQStore | null>(null);

  useEffect(() => {
    let cancelled = false;
    void BayiQStore.create().then((s) => {
      if (!cancelled) setStore(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return store;
}
