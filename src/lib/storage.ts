// safe web storage helpers. callers keep key names and value semantics;
// helpers only centralize the null/exception guards used across the app.

export function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readStorageString(key: string): string | null {
  try {
    return getLocalStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorageString(key: string, value: string): void {
  try {
    getLocalStorage()?.setItem(key, value);
  } catch {
    // ignore
  }
}

export function removeStorageItem(key: string): void {
  try {
    getLocalStorage()?.removeItem(key);
  } catch {
    // ignore
  }
}

export function readStorageJson<T>(key: string): T | null {
  const raw = readStorageString(key);
  if (raw == null) return null;
  try {
    // SAFETY: callers validate the parsed value against the expected shape.
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStorageJson<T>(key: string, value: T): void {
  try {
    const raw = JSON.stringify(value);
    writeStorageString(key, raw);
  } catch {
    // ignore
  }
}
