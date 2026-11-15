#!/usr/bin/env bun
/**
 * Fail the release gates when the vendored changelog drifts from RELEASE.md.
 *
 * RELEASE.md is the single source of truth for a release body: the same file
 * becomes the GitHub release and, via build-changelog.ts, the markdown that
 * src/lib/changelog.ts embeds for the in-app Changelog modal. This script
 * compares them so a release never ships notes the app does not carry (or
 * vice versa). Rendering it is deferred to the modal, not to runtime.
 *
 * usage: bun scripts/check-changelog-sync.ts [--release]
 *   --release additionally requires the notes' version to match the
 *   package.json version, the state a real release must be in.
 */
import { CHANGELOG_MARKDOWN, CHANGELOG_VERSION } from "../src/lib/changelog";
import { readPackageVersion, readProjectText } from "./shared";

async function main() {
  const release = process.argv.includes("--release");
  const failures: string[] = [];

  const notes = await readProjectText("RELEASE.md");

  if (CHANGELOG_MARKDOWN !== notes) {
    failures.push("src/lib/changelog.ts differs from RELEASE.md");
  }

  if (notes.startsWith("# ")) {
    failures.push(
      "RELEASE.md must not start with a `# ` title line: the release page " +
        "and the modal header already show the version, so a title line " +
        "would repeat it",
    );
  }
  if (!/^\*\*Full Changelog\*\*:/m.test(CHANGELOG_MARKDOWN)) {
    failures.push(
      "RELEASE.md must carry a `**Full Changelog**: <url>` footer line",
    );
  }

  if (release) {
    const pkgVersion = await readPackageVersion();
    if (CHANGELOG_VERSION !== pkgVersion) {
      failures.push(
        `vendored notes are v${CHANGELOG_VERSION} but package.json is ${pkgVersion}`,
      );
    }
  }

  if (failures.length) {
    console.error("changelog sync failed:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(
    `✓ changelog vendored from RELEASE.md${release ? ` for v${CHANGELOG_VERSION}` : ""}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
