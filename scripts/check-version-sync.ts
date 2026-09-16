#!/usr/bin/env bun
/**
 * fail the release gates when the version declarations drift apart.
 *
 * package.json is canonical; bump-version.ts mirrors it into Cargo.toml,
 * tauri.conf.json and src/lib/version.ts. the updater compares the compiled
 * binary version against latest.json while the ui reports the binary version,
 * so any drift between these four files shows users the wrong version after
 * an update. runs locally and on CI before a release.
 *
 * usage: bun scripts/check-version-sync.ts
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

const versionInVersionTs = (source: string): string | null => {
  const match = source.match(/export const VERSION = "([\d.]+)";/);
  return match?.[1] ?? null;
};

async function main() {
  // SAFETY: package.json always carries a string version field; parsed only to
  // read the current value, never re-serialized.
  const pkg = JSON.parse(
    await readFile(join(ROOT, "package.json"), "utf8"),
  ) as { version: string };
  const pkgVersion = pkg.version;

  const failures: string[] = [];
  const same = (label: string, found: string | null | undefined): void => {
    if (found !== pkgVersion) {
      failures.push(
        `${label} is ${found ?? "missing"}, expected ${pkgVersion}`,
      );
    }
  };

  const cargo = await readFile(join(ROOT, "src-tauri/Cargo.toml"), "utf8");
  same("src-tauri/Cargo.toml", cargo.match(/^version = "([\d.]+)"$/m)?.[1]);

  // SAFETY: tauri.conf.json always carries a string version field under
  // {"version": "..."}.
  const tauri = JSON.parse(
    await readFile(join(ROOT, "src-tauri/tauri.conf.json"), "utf8"),
  ) as { version?: string };
  same("src-tauri/tauri.conf.json", tauri.version);

  same(
    "src/lib/version.ts",
    versionInVersionTs(
      await readFile(join(ROOT, "src/lib/version.ts"), "utf8"),
    ),
  );

  if (failures.length) {
    console.error("version sync failed:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`✓ all version declarations agree at ${pkgVersion}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
