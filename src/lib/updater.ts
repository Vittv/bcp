import { useCallback, useEffect, useRef, useState } from "react";
import { IS_LINUX_TAURI, IS_TAURI } from "./desktop";

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
      await update.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [version]);

  // one auto-check per mount, so the banner fires on launch without
  // polling or re-checking on every navigation
  useEffect(() => {
    if (!auto || hasChecked.current) return;
    hasChecked.current = true;
    void check();
  }, [auto, check]);

  return { status, version, message, check, install };
}
