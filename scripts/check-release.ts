#!/usr/bin/env bun
/**
 * validate a released tag's updater artifacts before it is published.
 *
 * the desktop app's updater consumes the release's latest.json: version,
 * per-platform installer urls and minisign signatures. a release whose assets
 * are missing or whose version is stale breaks every user's next update, so
 * this checks the tag's latest.json against the release assets, plus the
 * rootless linux tarball. draft release assets are collaborators-only, so pass
 * GITHUB_TOKEN when running against one (CI sets it automatically).
 *
 * usage: GITHUB_TOKEN=... bun scripts/check-release.ts v0.2.2
 */
import { LINUX_TARBALL, RELEASE_REPO } from "../src/lib/release";

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function authHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json", ...authHeaders() },
  });
  if (!response.ok) {
    const body = await response.text();
    fail(`GET ${url} returned ${response.status}\n${body}`);
  }
  return response.json();
}

type PlatformEntry =
  | { url?: string; signature?: string }
  | { url?: string; signature?: string }[];

type Release = {
  tag_name: string;
  draft: boolean;
  assets: { name: string; browser_download_url: string }[];
};

type LatestJson = {
  version?: string;
  platforms?: Record<string, PlatformEntry>;
};

async function main() {
  const tag = process.argv[2];
  if (!tag?.startsWith("v")) fail("usage: bun scripts/check-release.ts v0.2.2");

  const expectedVersion = tag.replace(/^v/, "");
  const releasesUrl = `https://api.github.com/repos/${RELEASE_REPO}/releases/tags/${tag}`;
  // SAFETY: github releases API returns { tag_name, draft, assets } for valid tags
  const release = await fetchJson<Release>(releasesUrl);

  const assetNames = new Set(release.assets.map((a) => a.name));

  const latestAsset = release.assets.find((a) => a.name === "latest.json");
  if (!latestAsset) fail("no latest.json asset found on the release");

  // SAFETY: tauri updater's latest.json always contains { version, platforms }
  const latestJson = await fetchJson<LatestJson>(
    latestAsset.browser_download_url,
  );
  if (latestJson.version !== expectedVersion) {
    fail(
      `latest.json version is ${latestJson.version ?? "missing"}, expected ${expectedVersion}`,
    );
  }
  const platforms = latestJson.platforms ?? {};
  const keys = Object.keys(platforms);

  const has = (prefix: string): boolean =>
    keys.some((k) => k === prefix || k.startsWith(`${prefix}-`));
  if (!has("windows-x86_64-msi")) fail("no windows-x86_64-msi platform key");
  if (!has("windows-x86_64-nsis")) fail("no windows-x86_64-nsis platform key");
  if (!has("darwin")) fail("no darwin-* platform key");
  if (!has("linux")) fail("no linux-* platform key");

  const problems: string[] = [];
  for (const [key, raw] of Object.entries(platforms)) {
    const entries = Array.isArray(raw) ? raw : [raw];
    for (const entry of entries) {
      if (!entry.signature?.length) {
        problems.push(`${key}: missing signature`);
        continue;
      }
      if (!entry.url?.length) {
        problems.push(`${key}: missing url`);
        continue;
      }
      const artifactName = new URL(entry.url).pathname.split("/").pop();
      if (!artifactName) {
        problems.push(`${key}: could not parse artifact name from url`);
        continue;
      }
      if (!assetNames.has(artifactName)) {
        problems.push(
          `${key}: artifact ${artifactName} missing from release assets`,
        );
      }
    }
  }
  for (const problem of problems) console.error(`  - ${problem}`);

  const tarball = LINUX_TARBALL.split("/").pop();
  if (!assetNames.has(tarball ?? "")) {
    console.error(`  - tarball ${tarball} missing from release assets`);
    problems.push(`tarball ${tarball}`);
  }

  if (problems.length)
    fail(
      `${problems.length} issue(s) found; ${problems.length === 1 ? "1 blocker" : `${problems.length} blockers`} total`,
    );
  console.log(
    `✓ latest.json and release assets are valid for ${tag} (${release.draft ? "draft" : "published"})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
