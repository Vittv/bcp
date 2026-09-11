#!/usr/bin/env bun
// regenerate every shipped icon from the flat canterbury cross master.
//
// single source of truth is the 1024x1024 full-bleed master (default
// assets/canterbury_cross_icon_full_flat.png): a flat #7A3040 background
// with the white cross as the only other content. pass a new master path
// to swap the artwork in.
//
//   bun run tools/icons/regenerate.mjs [path/to/master.png]
//
// thin orchestration over two mainstream tools plus one small pixel pass:
//   sharp            resize + flat-color key (android fg/mono, maskable)
//   icon-gen         deterministic icon.icns for macOS
//   tauri icon       desktop png set, icon.ico, windows store logos
//
// everything is deterministic, so re-running on the same master leaves
// every output byte-for-byte unchanged.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import icongen from "icon-gen";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_MASTER = path.join(
  ROOT,
  "assets",
  "canterbury_cross_icon_full_flat.png",
);
const BG = [122, 48, 64]; // #7A3040
const CROSS_BBOX = 848; // non-background bbox of the 1024 master (measured)

// a child of the source image that keeps the cross color but drops the
// flat background (crisp key; every surface lays the same maroon beneath,
// so the one-pixel antialiased rim is not visible)
async function keyedCross(masterPath, white = false) {
  const { data, info } = await sharp(masterPath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const size = info.width * info.height;
  const px = Buffer.allocUnsafe(size * 4);
  for (let i = 0; i < size; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const alpha = r === BG[0] && g === BG[1] && b === BG[2] ? 0 : 255;
    px[i * 4] = white ? 255 : r;
    px[i * 4 + 1] = white ? 255 : g;
    px[i * 4 + 2] = white ? 255 : b;
    px[i * 4 + 3] = alpha;
  }
  return sharp(px, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

// square canvas of the given color
function canvas(size, rgba) {
  return sharp({
    create: { width: size, height: size, channels: 4, background: rgba },
  });
}

// cross resized so its content spans `target` px, centered on a `dim` square
async function placeCross(masterPath, dim, target, white = false) {
  const inner = Math.round((1024 * target) / CROSS_BBOX);
  const off = Math.floor((dim - inner) / 2);
  const cross = await keyedCross(masterPath, white);
  const crossBuf = await cross.resize(inner, inner).png().toBuffer();
  return canvas(dim, white ? [0, 0, 0, 0] : [0, 0, 0, 0])
    .composite([{ input: crossBuf, left: off, top: off }])
    .png()
    .toBuffer();
}

async function write(buf, rel) {
  const out = path.join(ROOT, rel);
  mkdirSync(path.dirname(out), { recursive: true });
  await sharp(buf).toFile(out);
  console.log(`wrote ${rel}`);
}

async function tauriDesktopSet(iconPath) {
  const tmp = path.join(ROOT, ".tmp-icons");
  rmSync(tmp, { recursive: true, force: true });
  execFileSync(
    "bunx",
    ["tauri", "icon", iconPath, "-o", tmp],
    { cwd: ROOT, stdio: "inherit" },
  );
  const target = path.join(ROOT, "src-tauri", "icons");
  const ignore = new Set(["icon.icns"]); // replaced deterministically below
  for (const name of readdirSync(tmp)) {
    if (ignore.has(name) || statSync(path.join(tmp, name)).isDirectory()) {
      continue; // also skips tauri's android/ and ios/ subdirs
    }
    copyFileSync(path.join(tmp, name), path.join(target, name));
  }
  console.log("copied desktop set from tauri icon");
}

async function deterministicIcns(iconPath) {
  const tmp = path.join(ROOT, ".tmp-icns");
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const report = await icongen(iconPath, tmp, {
    icns: ["16", "32", "64", "128", "256", "512"],
  });
  const icns = report.find((f) => f.endsWith(".icns"));
  if (!icns) throw new Error("icon-gen produced no icns");
  copyFileSync(
    icns,
    path.join(ROOT, "src-tauri", "icons", "icon.icns"),
  );
  console.log("wrote src-tauri/icons/icon.icns (icon-gen)");
}

async function main() {
  const master = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_MASTER;
  if (!statSync(master, { throwIfNoEntry: false })) {
    throw new Error(`master not found: ${master}`);
  }

  // mobile / expo: full-bleed opaque
  write(await sharp(master).resize(1024, 1024).ensureAlpha().png().toBuffer(), "assets/icon.png");
  write(await sharp(master).resize(64, 64).ensureAlpha().png().toBuffer(), "assets/favicon.png");

  // android adaptive stack
  write(await canvas(512, [BG[0], BG[1], BG[2], 255]).png().toBuffer(), "assets/android-icon-background.png");
  write(await placeCross(master, 512, 317), "assets/android-icon-foreground.png"); // cross 317/512 (62%)
  write(await placeCross(master, 432, 267, true), "assets/android-icon-monochrome.png"); // white, 267/432

  // web pwa
  write(await sharp(master).resize(192, 192).ensureAlpha().png().toBuffer(), "public/icons/icon-192.png");
  write(await sharp(master).resize(512, 512).ensureAlpha().png().toBuffer(), "public/icons/icon-512.png");
  write(
    await sharp(await canvas(512, [BG[0], BG[1], BG[2], 255]).png().toBuffer())
      .composite([{ input: await placeCross(master, 512, 264), left: 0, top: 0 }])
      .png()
      .toBuffer(),
    "public/icons/maskable-512.png",
  );

  const iconPath = path.join(ROOT, "assets", "icon.png");
  await tauriDesktopSet(iconPath);
  await deterministicIcns(iconPath);
  rmSync(path.join(ROOT, ".tmp-icons"), { recursive: true, force: true });
  rmSync(path.join(ROOT, ".tmp-icns"), { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});