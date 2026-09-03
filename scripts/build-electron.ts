// Compiles the Electron shell (main.ts, preload.ts and their shared IPC
// contract) into dist-electron/ with bun. electron and electron-updater are
// external: they are resolved from node_modules at runtime by the packaged
// app / native binaries, never bundled.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "..");
const outDir = path.join(repoRoot, "dist-electron");
const electronRoot = path.join(repoRoot, "electron");

// bun skips package postinstall scripts by default, which is how electron's
// binary normally lands. Verify the actual executable is present and, if not,
// run its install.js ourselves so `desktop:dev`/`desktop:build` never fail on
// a fresh clone.
function ensureElectronBinary(): void {
  const pkg = path.join(repoRoot, "node_modules", "electron");
  const marker = path.join(pkg, "path.txt");
  const binary = path.join(pkg, "dist", "electron");
  if (existsSync(marker) && existsSync(binary)) return;
  console.log("electron binary missing; running its install script…");
  const res = spawnSync(process.execPath, [path.join(pkg, "install.js")], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (res.status !== 0 || !existsSync(binary)) {
    console.error(
      "failed to install the electron binary; check network or run `node node_modules/electron/install.js` manually",
    );
    process.exit(1);
  }
}

ensureElectronBinary();

const outputs = await Bun.build({
  entrypoints: [
    path.join(electronRoot, "main.ts"),
    path.join(electronRoot, "preload.ts"),
  ],
  outdir: outDir,
  target: "node",
  // CommonJS: the sandboxed preload must be CJS, and CJS keeps __dirname
  // valid for both main and preload.
  format: "cjs",
  external: ["electron", "electron-updater"],
  // electron-updater pulls several optional backends that just import
  // gracefully; keep the bundle focused on what main.ts actually uses.
  minify: false,
  sourcemap: false,
});

if (!outputs.success) {
  console.error(outputs.logs.join("\n"));
  process.exit(1);
}

for (const out of outputs.outputs) {
  console.log(`wrote ${path.relative(process.cwd(), out.path)}`);
}
