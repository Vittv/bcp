// The renderer could otherwise reach full Node, which we do not want: the
// bridge is the only surface the app may touch. Promises resolve through
// ipcRenderer.invoke; renderer-side events (maximize/resize) are pushed back
// on a dedicated subscription channel.
import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";
import { type BcpBridge, type BcpWindowChange, IPC } from "./ipc";

const bridge: BcpBridge = {
  window: {
    // SAFETY: invoke returns Promise<any>; the channel always resolves the
    // typed payload this bridge exposes, and ipcMain is trusted material
    minimize: () => ipcRenderer.invoke(IPC.window.minimize) as Promise<void>,
    toggleMaximize: () =>
      ipcRenderer.invoke(IPC.window.toggleMaximize) as Promise<void>,
    close: () => ipcRenderer.invoke(IPC.window.close) as Promise<void>,
    // SAFETY: as above, typed by the matching ipcMain.handle in main.ts
    isMaximized: () =>
      ipcRenderer.invoke(IPC.window.isMaximized) as Promise<boolean>,
    positionAndSize: () => {
      // SAFETY: shape driven by rectOf() in main.ts, an untrusted-free value
      return ipcRenderer.invoke(IPC.window.positionAndSize) as Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    },
    monitor: () => {
      // SAFETY: shape driven by screen.getDisplayMatching() in main.ts
      return ipcRenderer.invoke(IPC.window.monitor) as Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
      } | null>;
    },
    onChange: (cb: (change: BcpWindowChange) => void) => {
      // SAFETY: event shields the typed window-change payload this bridge
      // forwards; ignore the leading Electron event, keep only the change
      const listener = (_event: IpcRendererEvent, change: BcpWindowChange) =>
        cb(change);
      ipcRenderer.on(IPC.window.onChange, listener);
      return () => ipcRenderer.removeListener(IPC.window.onChange, listener);
    },
  },
  updater: {
    // SAFETY: invoke returns Promise<any>; typed by the matching handle
    check: () =>
      ipcRenderer.invoke(IPC.updater.check) as Promise<{
        version: string;
      } | null>,
    download: () => ipcRenderer.invoke(IPC.updater.download) as Promise<void>,
    relaunch: () => ipcRenderer.invoke(IPC.updater.relaunch) as Promise<void>,
    version: () => ipcRenderer.invoke(IPC.updater.version) as Promise<string>,
  },
};

contextBridge.exposeInMainWorld("bcp", bridge);
