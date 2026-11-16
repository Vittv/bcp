import { useSyncExternalStore } from "react";

let active = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function beginScriptureLoad(): void {
  active += 1;
  emit();
}

export function endScriptureLoad(): void {
  active = Math.max(0, active - 1);
  emit();
}

export function trackScriptureLoad<T>(promise: Promise<T>): Promise<T> {
  beginScriptureLoad();
  return promise.finally(endScriptureLoad);
}

export function getScriptureLoadingCount(): number {
  return active;
}

export function subscribeScriptureLoading(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useScriptureLoading(): boolean {
  return (
    useSyncExternalStore(
      subscribeScriptureLoading,
      getScriptureLoadingCount,
      () => 0,
    ) > 0
  );
}
