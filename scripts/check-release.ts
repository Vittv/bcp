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

/** like fetchJson, but yields null instead of exiting on a non-ok response */
async function fetchOptional<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json", ...authHeaders() },
  });
  if (!response.ok) return null;
  return response.json();
}

type PlatformEntry =
  | { url?: string; signature?: string }
  | { url?: string; signature?: string }[];

type Release = {
  tag_name: string;
  draft: boolean;
  assets: { id: number; name: string; browser_download_url: string }[];
};

type LatestJson = {
  version?: string;
  platforms?: Record<string, PlatformEntry>;
};

async function fetchRelease(tag: string): Promise<Release> {
  const byTag = `https://api.github.com/repos/${RELEASE_REPO}/releases/tags/${tag}`;
  // SAFETY: the by-tag endpoint returns a release for any tag that has one
  const direct = await fetchOptional<Release>(byTag);
  if (direct) return direct;
  // a draft is invisible to the by-tag endpoint, which 404s, yet validate only
  // ever runs before the author publishes. so fall back to paging the list,
  // which does include drafts when authenticated with write access. tag_name
  // is the join key, and page in order so an old tag is still reachable.
  for (let page = 1; page <= 10; page++) {
    const list = await fetchJson<Release[]>(
      `https://api.github.com/repos/${RELEASE_REPO}/releases?per_page=100&page=${page}`,
    );
    const found = list.find((r) => r.tag_name === tag);
    if (found) return found;
    if (list.length < 100) break;
  }
  return fail(
    `no release found for tag ${tag}: missing, or a draft and GITHUB_TOKEN cannot see drafts`,
  );
}

async function main() {
  const tag = process.argv[2];
  if (!tag?.startsWith("v")) fail("usage: bun scripts/check-release.ts v0.2.2");

  const expectedVersion = tag.replace(/^v/, "");
  // SAFETY: fetchRelease returns a github release object or exits
  const release = await fetchRelease(tag);

  const assetNames = new Set(release.assets.map((a) => a.name));

  const latestAsset = release.assets.find((a) => a.name === "latest.json");
  if (!latestAsset) fail("no latest.json asset found on the release");

  // check by asset id rather than browser_download_url: on a draft that url
  // points at an `untagged-<hash>` placeholder and 404s, which would make this
  // check unrunnable in exactly the state it exists for. the asset endpoint
  // serves drafts, and needs octet-stream to return the body not metadata.
  const latestResponse = await fetch(
    `https://api.github.com/repos/${RELEASE_REPO}/releases/assets/${latestAsset.id}`,
    {
      headers: { Accept: "application/octet-stream", ...authHeaders() },
    },
  );
  if (!latestResponse.ok) {
    fail(
      `GET release asset ${latestAsset.id} returned ${latestResponse.status}\n${await latestResponse.text()}`,
    );
  }
  // SAFETY: the asset endpoint with octet-stream returns the raw uploaded file,
  // which for this release is the tauri updater's { version, platforms } json
  const latestJson = (await latestResponse.json()) as LatestJson;
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
