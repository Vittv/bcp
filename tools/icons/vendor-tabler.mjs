// Vendors bcp's icon subset from @tabler/icons-react (MIT) into a data module
// so Metro resolves only the 27 used glyphs instead of the whole pack (the
// package ships one bundled entry, no per-icon exports map, so importing from
// the index drags in ~6k icons). Run `bun tools/icons/vendor-tabler.mjs`
// after bumping @tabler/icons-react to refresh the file.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const NAMES = [
  "Book",
  "Bookmark",
  "Bible",
  "BrandGithub",
  "Calendar",
  "Check",
  "ChevronLeft",
  "ChevronRight",
  "Clock",
  "Copy",
  "Cross",
  "Crown",
  "DeviceDesktop",
  "DeviceLaptop",
  "Download",
  "Help",
  "InfoCircle",
  "LayoutSidebar",
  "List",
  "Moon",
  "Music",
  "Search",
  "Settings",
  "Star",
  "Sun",
  "Typography",
  "X",
];

const root = new URL("../..", import.meta.url).pathname;
const iconsDir = join(root, "node_modules/@tabler/icons-react/dist/esm/icons");
const out = join(root, "src/components/shell/icons.tabler.generated.ts");

// import() can't take a plain path string on some setups, so read + eval the
// module body instead; every file ends with `export { __iconNode, ... }`
async function glyph(name) {
  const file = join(iconsDir, `Icon${name}.mjs`);
  const src = await readFile(file, "utf8");
  const start = src.indexOf("const __iconNode = ");
  const end = src.indexOf("];", start);
  if (start < 0 || end < 0) {
    throw new Error(`could not find __iconNode in ${file}`);
  }
  const node = JSON.parse(
    src.slice(start + "const __iconNode = ".length, end + 1),
  );
  return node.map(([tag, attrs]) => {
    const { key: _key, ...rest } = attrs;
    return [tag, rest];
  });
}

const lines = [
  "// vendored from @tabler/icons-react by tools/icons/vendor-tabler.mjs",
  "// regenerate with `bun tools/icons/vendor-tabler.mjs` after bumping the package",
  "// (c) tabler.io, MIT license, https://tabler.io/icons",
  "",
  "export const GLYPHS: Record<string, [string, Record<string, string>][]> = {",
];
for (const name of NAMES) {
  lines.push(`  ${name}: ${JSON.stringify(await glyph(name))},`);
}
lines.push("};", "");

await writeFile(out, lines.join("\n"));
console.log(`wrote ${out} (${NAMES.length} glyphs)`);
