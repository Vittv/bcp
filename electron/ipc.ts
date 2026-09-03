// IPC channel names and shared types between the Electron main process and the
// preload renderer bridge. Kept in one module so both sides agree without a
// duplicated string.
export const IPC = {
  window: {
    minimize: "bcp:window:minimize",
    toggleMaximize: "bcp:window:toggleMaximize",
    close: "bcp:window:close",
    isMaximized: "bcp:window:isMaximized",
    positionAndSize: "bcp:window:positionAndSize",
    monitor: "bcp:window:monitor",
    onChange: "bcp:window:onChange",
  },
  updater: {
    check: "bcp:updater:check",
    download: "bcp:updater:download",
    relaunch: "bcp:updater:relaunch",
    version: "bcp:updater:version",
  },
} as const;

export type BcpRectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BcpWindowChange = { maximized: boolean };

// the shape asserted onto window.bcp by the preload (src/lib/desktop.ts reads
// this surface to detect the shell and gate desktop-only features)
export type BcpBridge = {
  window: {
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    positionAndSize: () => Promise<BcpRectangle>;
    monitor: () => Promise<BcpRectangle | null>;
    onChange: (cb: (change: BcpWindowChange) => void) => () => void;
  };
  updater: {
    check: () => Promise<{ version: string } | null>;
    download: () => Promise<void>;
    relaunch: () => Promise<void>;
    version: () => Promise<string>;
  };
};
