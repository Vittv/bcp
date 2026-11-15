import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import type { HistoryController } from "../lib/navigation/history";
import type { HistoryApi, HistorySnapshot } from "./HistoryContext.types";

export type {
  HistoryApi,
  HistorySnapshot,
  HistoryTab,
} from "./HistoryContext.types";

// note: fields within a snapshot are plain JSON values; restore applies them
// through the owning providers' raw setters so downstream state re-derives

const Ctx = createContext<HistoryApi | null>(null);

function makeApi(controller: HistoryController<HistorySnapshot>): HistoryApi {
  return {
    push: (change) => controller.push(change),
    replace: (change) => controller.replace(change),
    record: () => controller.record(),
    register: <K extends keyof HistorySnapshot>(
      key: K,
      get: () => HistorySnapshot[K],
      apply: (v: HistorySnapshot[K]) => void,
    ) => controller.register(key, get, apply),
    onRestored: (fn) => controller.onRestored(fn),
    isRestoring: () => controller.isRestoring(),
  };
}

export function HistoryProvider({
  controller,
  children,
}: {
  controller: HistoryController<HistorySnapshot> | null;
  children: ReactNode;
}) {
  // a single identity per controller so consumers can depend on it safely
  const api = useMemo<HistoryApi | null>(
    () => (controller ? makeApi(controller) : null),
    [controller],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useHistory(): HistoryApi | null {
  return useContext(Ctx);
}

// register one snapshot field for the lifetime of the owning provider.
// the app has no code paths that unmount these providers, so the
// registration effect only depends on the key itself; get/apply are
// read through refs to stay fresh without re-registering each render.
export function useHistoryField<K extends keyof HistorySnapshot>(
  key: K,
  get: () => HistorySnapshot[K],
  apply: (v: HistorySnapshot[K]) => void,
): void {
  const api = useContext(Ctx);
  const getRef = useRef(get);
  const applyRef = useRef(apply);
  getRef.current = get;
  applyRef.current = apply;
  useEffect(() => {
    if (!api) return;
    return api.register(
      key,
      () => getRef.current(),
      (v) => applyRef.current(v),
    );
  }, [api, key]);
}
