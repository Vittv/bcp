# Contributing

Thanks for contributing to bcp. The app is an Expo + React web app ("the PWA")
that doubles as a Tauri 2 desktop app by embedding the same web export in a
native shell.

## Setup

The only runtime requirement is [bun](https://bun.sh).

```sh
bun install
```

## Running and building

Web (PWA):

```sh
BASE_URL=/ bunx expo export -p web   # export at the webview/site root
bunx serve dist                      # or any static host
```

Desktop (Tauri):

```sh
bun run desktop:dev    # web export + debug window
bun run desktop:build  # release bundles for the current platform
```

`BASE_URL` configures the asset root per target (defaults to `/bcp`, the
GitHub Pages path; the desktop scripts pass `/` for the webview root). This is
the one config that must not be mixed up, the desktop webview has nothing at
`/bcp`.

Content updates: `bun scripts/fetch-web.ts` and `bun scripts/fetch-kjv.ts`
refresh the embedded Office content and KJV scripture from their sources.

## Tests and checks

```sh
bun test
bun run check           # biome + oxlint
bun run format          # biome format
```

## Icons

All app, browser, and platform icons derive from a single 1024x1024 flat
master, `assets/canterbury_cross_icon_full_flat.png`. After replacing the
artwork there, regenerate every shipped icon with:

```sh
bun icons
```

The derivation is deterministic (sharp keying + `icon-gen` icns + `tauri
icon`), so re-running on an unchanged master leaves the working tree clean.
The two TopBar marks `assets/app_icons/cross_light_192.png` and
`cross_dark_192.png` are UI icons and are edited by hand, not from the master.

## Releases

One source of truth: `RELEASE.md` at the repo root carries the release notes for
the next release. The same markdown becomes the in-app Changelog window, the
desktop update-banner notes, and the GitHub Release body. Write it before
releasing: a `# bcp vX.Y.Z` title line, `##`/`###` sections, prose and bullets,
and a trailing `**Full Changelog**: <url>` line.

Releasing is done by you, not CI, so every release commit stays under your
identity:

1. Write the notes in `RELEASE.md` for the version you're about to ship.
2. Run `bun scripts/bump-version.ts x.y.z`: it updates every version
   declaration and regenerates `src/lib/changelog.ts` from `RELEASE.md` (the
   app ships the notes bundled, not fetched at runtime).
3. Check the gates: `bun run check:sync` and `bun run check:changelog --release`.
4. Commit `chore(release): x.y.z`, then push the branch and the tag:
   `git tag vx.y.z && git push origin main && git push origin vx.y.z`.
   Pushing the `v*` tag builds each platform natively
   (`.deb`/`.rpm`/tarball/`.dmg`/`.exe`/`.msi`) and publishes a draft GitHub
   Release whose body is `RELEASE.md`, then a validate job gates the artifacts.
   `deploy.yml` ships the web PWA to GitHub Pages. The Linux install one-liner
   in the README pulls `scripts/install-linux.sh` from `main`.
5. Review the draft release and publish it on GitHub.

Notes for contributors:

- Use conventional commit messages with no extra body.
- Keep the flattened runtime free of bundler surprises: verify changes work
  from a plain `bunx expo export -p web`, not just the dev server.
- Tests live next to what they cover under `src/**/__tests__`.