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

// shared state for the launch banner and the settings section, so update
// detection and install live in one place. tauri uses the updater plugin;
// the web build watches the service worker for a newly deployed version.
export function useUpdateStatus(auto = false) {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [version, setVersion] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  // release notes for a pending tauri update, shown before install
  const [body, setBody] = useState<string | null>(null);
  const hasChecked = useRef(false);

  const check = useCallback(async () => {
    if (!IS_TAURI) {
      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return;
      }
      setStatus("checking");
      setMessage("");
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        await reg?.update();
        setStatus((current) =>
          current === "available" ? current : "upToDate",
        );
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : String(error));
      }
      return;
    }
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
    if (!IS_TAURI) {
      if (typeof window !== "undefined") {
        setStatus("installing");
        window.location.reload();
      }
      return;
    }
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

  // tauri: one auto-check per mount. web: watch the service worker so a new
  // deployment surfaces a prompt without a manual check.
  useEffect(() => {
    if (!auto || hasChecked.current) return;
    if (IS_TAURI) {
      const timer = setTimeout(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;
        void check();
      }, LAUNCH_CHECK_DELAY_MS);
      return () => clearTimeout(timer);
    }
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    hasChecked.current = true;
    let cancelled = false;
    const refreshOnChange = !!navigator.serviceWorker.controller;
    const onControllerChange = () => {
      if (refreshOnChange && !cancelled) setStatus("available");
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    void (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg || cancelled) return;
        const markAvailable = () => {
          if (!cancelled) setStatus("available");
        };
        const watchInstalling = (worker: ServiceWorker | null) => {
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              markAvailable();
            }
          });
        };
        if (reg.waiting && navigator.serviceWorker.controller) markAvailable();
        watchInstalling(reg.installing);
        reg.addEventListener("updatefound", () => {
          watchInstalling(reg.installing);
        });
      } catch {
        // update detection is best-effort on the web
      }
    })();
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, [auto, check]);

  return { status, version, message, body, check, install };
}
