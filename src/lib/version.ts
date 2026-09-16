import { useEffect, useState } from "react";
import { IS_TAURI } from "./desktop";

// single source of truth for the user-visible version string on web/pwa.
// package.json is the canonical version; the release workflow rewrites this
// file and the three build-manifest versions so they stay in sync. the
// desktop shell ignores it and reports the binary version instead (see
// useAppVersion), because the updater compares against that.
export const VERSION = "0.2.11";

// in the desktop shell the compiled-in binary version is the update truth:
// the updater compares it against latest.json, so the ui reports the binary
// version there and only falls back to VERSION on web/pwa builds.
export function useAppVersion() {
  const [version, setVersion] = useState(VERSION);
  useEffect(() => {
    if (!IS_TAURI) return;
    let cancelled = false;
    import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then((binary) => {
        if (!cancelled) setVersion(binary);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return version;
}
