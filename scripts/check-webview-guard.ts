#!/usr/bin/env bun
/**
 * assert the desktop shell stays out of the pwa service worker.
 *
 * on windows tauri serves the app over http://tauri.localhost, which matches
 * the worker's http registration guard, so the same script block must also
 * check __TAURI_INTERNALS__: without it the webview would keep an old
 * bundle. checks the source template always and the exported dist too when
 * present (post export, pre tauri build).
 *
 * usage: bun scripts/check-webview-guard.ts
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

const SCRIPT_BLOCKS = /<script[\s\S]*?<\/script>/g;

function isGuardPresent(html: string): string | null {
  for (const block of html.matchAll(SCRIPT_BLOCKS)) {
    if (block[0].includes("serviceWorker")) {
      return /\b__TAURI_INTERNALS__\b/.test(block[0])
        ? null
        : "worker registration is not guarded by __TAURI_INTERNALS__";
    }
  }
  return "no service worker registration script block found";
}

async function check(file: string): Promise<string | null> {
  const problem = isGuardPresent(await readFile(file, "utf8"));
  if (problem) return `${file}: ${problem}`;
  console.log(`✓ ${file}: worker registration is tauri-safe`);
  return null;
}

async function main() {
  const reported: string[] = [];
  const files = [join(ROOT, "public/index.html")];
  const dist = join(ROOT, "dist/index.html");
  if (existsSync(dist)) files.push(dist);

  for (const file of files) {
    const problem = await check(file);
    if (problem) reported.push(problem);
  }

  if (reported.length) {
    for (const problem of reported) console.error(`error: ${problem}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
