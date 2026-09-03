// Electron main process: creates the desktop window and owns the tiny IPC
// surface the renderer bridge talks to (window controls + auto-update). The
// renderer UI is the same `dist/` that the PWA ships, so the shell stays thin:
// no browser, no runtime runtime, no per-platform webview quirks.

import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  app,
  BrowserWindow,
  ipcMain,
  net,
  protocol,
  screen,
  session,
} from "electron";
import { autoUpdater } from "electron-updater";
import { type BcpRectangle, IPC } from "./ipc";

let mainWindow: BrowserWindow | null = null;

const isMac = process.platform === "darwin";

// Bun statically rewrites `__dirname` to the source file's folder, so relying
// on it breaks once the shell is compiled to dist-electron/ + packaged into
// an asar. Derive the app root instead: unpackaged, the entry is a compiled
// file inside dist-electron/ (root = one level up); packaged, the entry sits
// at the asar root next to dist/ and dist-electron/preload.js.
const appRoot = app.isPackaged
  ? app.getAppPath()
  : path.dirname(app.getAppPath());

// The exported web app addresses its bundle with root-absolute paths
// (/_expo/..., /favicon.ico), which resolve under a protocol root. Serve the
// dist folder through a custom bcp:// scheme (standard + secure + fetch) so
// the exact same export renders that it would over http(s) or tauri://. The
// scheme must be declared privileged before app ready, per Electron docs.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "bcp",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

// map a request under bcp:// to a file inside dist, protecting against
// path traversal, and fall back to index.html for SPA deep routes. Following
// Electron's documented example, the scheme uses a fixed host ("app") so that
// root-absolute asset references (/_expo/...) resolve onto that host and hit
// this handler with a plain pathname.
function serveBcp(distPath: string) {
  const indexHtml = path.join(distPath, "index.html");
  return (req: Request): ReturnType<typeof net.fetch> => {
    const url = new URL(req.url);
    const rel = url.pathname.replace(/^\/+/, "");
    const candidate = rel ? path.join(distPath, rel) : indexHtml;
    const safe =
      candidate === indexHtml ||
      (candidate.startsWith(distPath) &&
        !path.relative(distPath, candidate).startsWith(".."));
    if (!safe) {
      // SAFETY: a plain Response implements the fetch shape net.fetch returns;
      // the cast lets a non-streaming 403 reuse the same return type
      return Promise.resolve(
        new Response("forbidden", {
          status: 403,
          headers: { "content-type": "text/plain" },
        }),
      ) as ReturnType<typeof net.fetch>;
    }
    if (candidate === indexHtml || existsSync(candidate)) {
      return net.fetch(pathToFileURL(candidate).toString());
    }
    // SPA: missing asset or deep route -> the app shell
    return net.fetch(pathToFileURL(indexHtml).toString());
  };
}

function createUrl(): string {
  // a dev server url, when provided, beats the exported bundle
  const devUrl = process.env.BCP_DEV_URL;
  if (devUrl) return devUrl;
  // otherwise the exported bundle, served through the bcp:// scheme under the
  // fixed "app" host (root-absolute asset paths in index.html resolve there)
  return "bcp://app/index.html";
}

async function createWindow(): Promise<void> {
  // macOS keeps native traffic lights overlaid on the app's custom titlebar
  // (the top bar reserves a left macGap for them); Windows/Linux hide the OS
  // chrome entirely and use the app's min/max/close buttons. Every platform
  // thus runs the app-drawn titlebar, so the system frame is always hidden.
  let trafficLightPosition: { x: number; y: number } | undefined;
  if (isMac) {
    // center the lights vertically in the 40px top bar
    trafficLightPosition = { x: 12, y: 12 };
  }
  const win = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: "#e0dbd0",
    titleBarStyle: "hidden",
    trafficLightPosition,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(appRoot, "dist-electron", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow = win;

  // diagnostic plumbing: surface the page's load result and renderer errors
  // to the terminal so a blank window is explainable instead of a mystery
  const wc = win.webContents;
  wc.on("did-start-loading", () => console.log("[renderer] did-start-loading"));
  wc.on("did-finish-load", () => console.log("[renderer] did-finish-load"));
  wc.on("did-fail-load", (_ev, code, desc, url) => {
    console.log(
      `[renderer] did-fail-load code=${code} desc=${desc} url=${url}`,
    );
  });
  wc.on("render-process-gone", (_ev, details) => {
    console.log(
      `[renderer] render-process-gone reason=${details.reason} exitCode=${details.exitCode}`,
    );
  });
  wc.on("console-message", (_ev, level, message, line, sourceId) => {
    // this electron build surfaces the legacy positional signature
    const label = ["verbose", "info", "warning", "error"][level] ?? level;
    console.log(
      `[renderer:console] (${label}) ${message} @ ${sourceId}:${line}`,
    );
  });

  // push maximize state changes to the renderer so the Restore/Maximize glyph
  // stays correct without polling
  const pushChange = (maximized: boolean) => {
    if (!win.isDestroyed())
      win.webContents.send(IPC.window.onChange, { maximized });
  };
  win.on("maximize", () => pushChange(true));
  win.on("unmaximize", () => pushChange(false));
  win.on("resize", () => {
    // the app infers "maximized" on Linux from monitor coverage (see
    // WindowControls); a resize is the one signal it can hang the inference on
    if (!isMac && !win.isDestroyed()) {
      pushChange(win.isMaximized());
    }
  });

  await win.loadURL(createUrl());

  // ready-to-show fires only after the first paint, which some Linux/GPU
  // setups delay or skip entirely; a fallback guarantees the window appears
  // even when the compositor is slow or the page fails to paint.
  const reveal = () => {
    if (win.isVisible()) return;
    console.log("[renderer] showing window");
    win.show();
  };
  win.once("ready-to-show", reveal);
  win.webContents.once("did-finish-load", reveal);
  setTimeout(reveal, 2000);
}

function rectOf(b: BrowserWindow): BcpRectangle {
  const [x, y] = b.getPosition();
  const [width, height] = b.getSize();
  return { x, y, width, height };
}

function registerWindowIpc(): void {
  ipcMain.handle(IPC.window.minimize, () => mainWindow?.minimize());
  ipcMain.handle(IPC.window.toggleMaximize, () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle(IPC.window.close, () => mainWindow?.close());
  ipcMain.handle(
    IPC.window.isMaximized,
    () => mainWindow?.isMaximized() ?? false,
  );

  ipcMain.handle(IPC.window.positionAndSize, () =>
    mainWindow ? rectOf(mainWindow) : { x: 0, y: 0, width: 0, height: 0 },
  );

  ipcMain.handle(IPC.window.monitor, () => {
    // best-effort: the display the window currently overlaps the most
    const win = mainWindow;
    if (!win) return null;
    const display = screen.getDisplayMatching(win.getBounds());
    const { x, y, width, height } = display.bounds;
    return { x, y, width, height } satisfies BcpRectangle;
  });
}

function registerUpdaterIpc(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  ipcMain.handle(IPC.updater.version, () => app.getVersion());

  ipcMain.handle(IPC.updater.check, async () => {
    // never attempt network checks while developing from source
    if (!app.isPackaged) return null;
    const result = await autoUpdater.checkForUpdates();
    if (!result?.updateInfo) return null;
    // electron-updater has no update object to persist; re-resolve on demand.
    return { version: result.updateInfo.version };
  });

  ipcMain.handle(IPC.updater.download, async () => {
    if (app.isPackaged) await autoUpdater.downloadUpdate();
  });

  ipcMain.handle(IPC.updater.relaunch, () => {
    // quitAndInstall relaunches only if a downloaded update is pending;
    // otherwise a plain restart is equivalent. Always exit cleanly first.
    if (app.isPackaged) autoUpdater.quitAndInstall(false, true);
    else app.quit();
  });
}

app.whenReady().then(() => {
  // Hardening plus silencing Electron's dev-only CSP warning: the exported
  // bundle is self-contained (its assets, favicon, and one bundled woff2),
  // so restrict the policy to the bcp:// origin with inline styles allowed
  // (Expo injects them) and everything else same-origin sheet/font/data.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
  ].join("; ");
  // Expo's exported index.html carries a small static inline script (a
  // service-worker registration guard that is inert under bcp://), so allow
  // inline scripts. The app is fully local and self-contained; contextIsolation
  // + sandbox stay on, and no remote content is ever loaded.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders ?? {};
    headers["Content-Security-Policy"] = [csp];
    callback({ responseHeaders: headers });
  });

  protocol.handle("bcp", serveBcp(path.join(appRoot, "dist")));
  registerWindowIpc();
  registerUpdaterIpc();
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
