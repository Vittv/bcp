// Browser back/forward integration. Every selection navigation (page
// changes, opening a psalm/saint/office/chapter, stepping a date, picking a
// tab) pushes a serializable snapshot onto the browser history; popstate
// restores the matching snapshot so native controls (desktop mouse buttons,
// trackpad gestures, phone back) traverse app state instead of leaving the
// page. The controller is platform-free and driven by a fake window-like
// object in tests.

// the generic parameter S is the concrete snapshot shape each consumer
// supplies (see HistorySnapshot in HistoryContext); the controller treats
// it as an opaque bundle of named fields, never as an untyped blob
export type HistoryPlatform<S> = {
  addEventListener: (type: "popstate", cb: (e: PopStateEvent) => void) => void;
  removeEventListener: (
    type: "popstate",
    cb: (e: PopStateEvent) => void,
  ) => void;
  history: {
    // the state pushed is the snapshot at push time, kept JSON-safe
    pushState: (
      state: Partial<S>,
      unused: string,
      url?: string | URL | null,
    ) => void;
    replaceState: (
      state: Partial<S>,
      unused: string,
      url?: string | URL | null,
    ) => void;
  };
  // the URL every entry keeps: we rewrite state in place rather than
  // changing the address bar (a reload must land on the app root)
  seedUrl: string;
};

export type HistoryController<S> = {
  register: <K extends keyof S>(
    key: K,
    get: () => S[K],
    apply: (v: S[K]) => void,
  ) => () => void;
  push: (change: Partial<S>) => void;
  // record the live snapshot as a distinct step even when it equals the
  // current state. used to reify a filtered index list before opening a
  // detail, so Back from the pick lands on the list instead of skipping it.
  // the no-op guard in push() would drop that entry (it is identical), so
  // this bypasses the guard on purpose.
  record: () => void;
  onRestored: (fn: (entry: Partial<S>) => void) => () => void;
  isRestoring: () => boolean;
  start: () => void;
  stop: () => void;
};

// compare two snapshots field by field; values are small plain objects
function sameSnapshot<S extends object>(a: Partial<S>, b: Partial<S>): boolean {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    // SAFETY: keys come from Object.keys over Partial<S> values
    const k = key as keyof S;
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return false;
  }
  return true;
}

// compare two typed field values; every snapshot field is a primitive,
// null, or a small plain object, so the JSON form is exact at this size
function sameValue<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function createHistoryController<S extends object>(
  platform: HistoryPlatform<S>,
): HistoryController<S> {
  const suppliers = new Map<keyof S, () => S[keyof S]>();
  const appliers = new Map<keyof S, (v: S[keyof S]) => void>();
  const restored = new Set<(entry: Partial<S>) => void>();
  let seeded = false;
  let restoring = false;

  // the current state every push starts from: all registered getters
  const snapshot = (): Partial<S> => {
    // SAFETY: fields are materialized from suppliers below before the
    // snapshot leaves this module
    const snap = {} as Partial<S>;
    for (const [key, get] of suppliers) {
      snap[key] = get();
    }
    return snap;
  };

  // the first push seeds the entry the app was loaded on, so Back from
  // the first navigation returns to it instead of a blank document entry
  const ensureSeeded = () => {
    if (seeded) return;
    seeded = true;
    platform.history.replaceState(snapshot(), "", platform.seedUrl);
  };

  const push = (change: Partial<S>) => {
    if (restoring) return;
    const keys = Object.keys(change);
    if (keys.length === 0) return;
    const current = snapshot();
    const next = { ...current, ...change };
    // skip no-ops (re-selecting the already-open psalm): each step must
    // produce a distinct back/forward destination
    if (sameSnapshot(next, current)) return;
    ensureSeeded();
    platform.history.pushState(next, "", platform.seedUrl);
  };

  const record = () => {
    if (restoring) return;
    const current = snapshot();
    if (Object.keys(current).length === 0) return;
    ensureSeeded();
    platform.history.pushState(current, "", platform.seedUrl);
  };

  const restore = (entry: Partial<S>) => {
    restoring = true;
    try {
      const keys = Object.keys(entry);
      for (const key of keys) {
        // SAFETY: Object.keys over a Partial<S> entry yields keyof S keys
        const k = key as keyof S;
        const apply = appliers.get(k);
        if (apply && k in entry) {
          // SAFETY: k in entry guarantees the field is present in the snapshot
          const value = entry[k] as S[keyof S];
          // apply only when the field actually changes. a restore that lands
          // on the state the page already holds (revisiting the same entry)
          // skips the setState instead of re-rendering over an equal value;
          // the restored listeners still fire for chrome cleanup below
          const read = suppliers.get(k);
          if (!read || !sameValue(read(), value)) apply(value);
        }
      }
      for (const fn of restored) fn(entry);
    } finally {
      restoring = false;
    }
  };

  const onPop = (e: PopStateEvent) => {
    const state = e.state;
    if (state !== null && typeof state === "object") {
      // SAFETY: only our own snapshots are ever pushed; non-object state
      // (a blank browser entry) is ignored and the object guard above
      // rejects everything else before this cast
      restore(state as Partial<S>);
    }
  };

  const register = <K extends keyof S>(
    key: K,
    get: () => S[K],
    apply: (v: S[K]) => void,
  ): (() => void) => {
    suppliers.set(key, get);
    // SAFETY: the appliers map is keyed per-field; each registered apply
    // handles exactly the S[K] value its key produces
    appliers.set(key, apply as (v: S[keyof S]) => void);
    return () => unregister(key);
  };

  const unregister = (key: keyof S) => {
    suppliers.delete(key);
    appliers.delete(key);
  };

  const onRestored = (fn: (entry: Partial<S>) => void): (() => void) => {
    restored.add(fn);
    return () => {
      restored.delete(fn);
    };
  };

  const start = () => platform.addEventListener("popstate", onPop);
  const stop = () => platform.removeEventListener("popstate", onPop);

  return {
    register,
    push,
    record,
    onRestored,
    isRestoring: () => restoring,
    start,
    stop,
  };
}
