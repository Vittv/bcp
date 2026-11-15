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
import { readPackageVersion, readProjectJson, readProjectText } from "./shared";

const versionInVersionTs = (source: string): string | null => {
  const match = source.match(/export const VERSION = "([\d.]+)";/);
  return match?.[1] ?? null;
};

async function main() {
  const pkgVersion = await readPackageVersion();

  const failures: string[] = [];
  const same = (label: string, found: string | null | undefined): void => {
    if (found !== pkgVersion) {
      failures.push(
        `${label} is ${found ?? "missing"}, expected ${pkgVersion}`,
      );
    }
  };

  const cargo = await readProjectText("src-tauri", "Cargo.toml");
  same("src-tauri/Cargo.toml", cargo.match(/^version = "([\d.]+)"$/m)?.[1]);

  const tauri = await readProjectJson<{ version?: string }>(
    "src-tauri",
    "tauri.conf.json",
  );
  same("src-tauri/tauri.conf.json", tauri.version);

  same(
    "src/lib/version.ts",
    versionInVersionTs(await readProjectText("src", "lib", "version.ts")),
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
