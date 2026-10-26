import { useCallback, useEffect, useRef, useState } from "react";
import { IS_LINUX_TAURI, IS_TAURI } from "./desktop";

// the launch check runs past the first paint, so a slow or offline release
// lookup never competes with boot
const LAUNCH_CHECK_DELAY_MS = 2000;

export type UpdateStatus =
  | "idle"
  | "checking"
  | "upToDate"
  | "available"
  | "installing"
  | "error";

// shared state for the launch banner and the settings section, so the
// tauri updater flow (check, download, relaunch) lives in one place.
// inert on the web and pwa builds, where there is no updater backend.
export function useUpdateStatus(auto = false) {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [version, setVersion] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  // the release notes the remote release carries (the same RELEASE.md that
  // feeds the in-app changelog), shown before the update is installed
  const [body, setBody] = useState<string | null>(null);
  const hasChecked = useRef(false);

  const check = useCallback(async () => {
    if (!IS_TAURI) return;
    setStatus("checking");
    setMessage("");
    try {
      const { check: checkUpdate } = await import("@tauri-apps/plugin-updater");
      const update = await checkUpdate();
      if (!update) {
        setStatus("upToDate");
        return;
      }
      setVersion(update.version);
      setBody(update.body ?? null);
      setStatus("available");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const install = useCallback(async () => {
    if (!IS_TAURI) return;
    setStatus("installing");
    setMessage("");
    try {
      if (IS_LINUX_TAURI) {
        // rootless install: re-run install-linux.sh for the pending version,
        // which swaps in the fresh binary; the command relaunches into it
        // itself because tauri's restart cannot respawn a replaced binary
        if (!version) throw new Error("no pending update to install");
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("run_rootless_update", { version });
        return;
      }
      const { check: checkUpdate } = await import("@tauri-apps/plugin-updater");
      const update = await checkUpdate();
      if (!update) {
        setStatus("upToDate");
        return;
      }
      setVersion(update.version);
      setBody(update.body ?? null);
      await update.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [version]);

  // one auto-check per mount: the timer keeps a slow release lookup off the
  // first paint, and hasChecked keeps navigation from re-running it
  useEffect(() => {
    if (!auto || hasChecked.current) return;
    const timer = setTimeout(() => {
      if (hasChecked.current) return;
      hasChecked.current = true;
      void check();
    }, LAUNCH_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [auto, check]);

  return { status, version, message, body, check, install };
}
