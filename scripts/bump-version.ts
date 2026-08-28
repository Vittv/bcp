#!/usr/bin/env bun
/**
 * Set the app version across every location that must stay in sync.
 *
 * package.json is the canonical single source of truth: the build manifests
 * and the user-visible version constant all mirror it. Calling this script
 * with a version rewrites package.json first, then propagates to:
 *
 *   - src-tauri/Cargo.toml        (Rust crate version)
 *   - src-tauri/tauri.conf.json   (bundle version)
 *   - src/lib/version.ts          (sidebar/about display)
 *
 * JSON files are edited in place (by replacing only the version value) so
 * their existing formatting, which biome enforces, is left untouched.
 *
 * Usage: bun scripts/bump-version.ts <version>
 * For example: bun scripts/bump-version.ts 0.2.0
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const PKG_PATH = join(ROOT, "package.json");
const CARGO_PATH = join(ROOT, "src-tauri/Cargo.toml");
const TAURI_PATH = join(ROOT, "src-tauri/tauri.conf.json");
const VERSION_PATH = join(ROOT, "src/lib/version.ts");

const requested = process.argv[2];

const SEMVER = /^\d+\.\d+\.\d+$/;

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Replace only the version value in a JSON-ish text file that may already be
// formatter-optimized, leaving all other formatting untouched.
function replaceJsonVersion(text: string, from: string, to: string): string {
  const re = new RegExp(`("version"\\s*:\\s*")${escapeRegExp(from)}(")`);
  return text.replace(re, `$1${to}$2`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const pkgSource = await readFile(PKG_PATH, "utf8");
  // SAFETY: package.json always carries a string version field; parsed only to
  // read the current value, never re-serialized.
  const pkg = JSON.parse(pkgSource) as { version: string };

  let version = pkg.version;
  if (requested) {
    if (!SEMVER.test(requested)) {
      fail(`invalid version "${requested}", expected semver like 0.2.0`);
    }
    version = requested;
  }
  const from = pkg.version;

  if (from !== version) {
    await writeFile(PKG_PATH, replaceJsonVersion(pkgSource, from, version));
    console.log(`  ✓ package.json -> ${version}`);
  } else {
    console.log(`  = package.json already ${version}`);
  }

  // Cargo.toml: [package] version = "x.y.z"
  const cargo = await readFile(CARGO_PATH, "utf8");
  const cargoNext = cargo.replace(
    /^version = "[\d.]+"$/m,
    `version = "${version}"`,
  );
  if (cargoNext !== cargo) {
    await writeFile(CARGO_PATH, cargoNext);
    console.log(`  ✓ src-tauri/Cargo.toml -> ${version}`);
  }

  // tauri.conf.json: JSON version field, edited in place to keep formatting
  const tauriSource = await readFile(TAURI_PATH, "utf8");
  const tauriNext = replaceJsonVersion(tauriSource, from, version);
  if (tauriNext !== tauriSource) {
    await writeFile(TAURI_PATH, tauriNext);
    console.log(`  ✓ src-tauri/tauri.conf.json -> ${version}`);
  }

  // src/lib/version.ts: export const VERSION = "x.y.z";
  const versionSource = await readFile(VERSION_PATH, "utf8");
  const versionNext = versionSource.replace(
    /export const VERSION = "[\d.]+";/,
    `export const VERSION = "${version}";`,
  );
  if (versionNext !== versionSource) {
    await writeFile(VERSION_PATH, versionNext);
    console.log(`  ✓ src/lib/version.ts -> ${version}`);
  }

  console.log(`\n✓ Version is now ${version} everywhere`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
