#!/usr/bin/env bash
#
# Assemble the rootless Linux tarball that install-linux.sh installs.
#
# The tarball carries only the binary, a desktop-entry template and the icons:
# the whole point is a small download that relies on the system webview, unlike
# the AppImage which bundles every runtime library.
#
# Usage:
#   sh scripts/package-linux.sh [VERSION]        (default: version from tauri.conf.json)
#
# Produces ./bcp-linux-<arch>.tar.gz with a payload layout of:
#   bcp-<version>/bin/bcp
#   bcp-<version>/bcp.desktop
#   bcp-<version>/icons/32.png
#   bcp-<version>/icons/128.png

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCH="${BCP_ARCH:-x86_64}"

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  VERSION="$(
    sed -n 's/^  "version": "\([0-9.]*\)",/\1/p' "$ROOT/src-tauri/tauri.conf.json" | head -n1
  )"
fi
[ -n "$VERSION" ] || { echo "error: could not determine version" >&2; exit 1; }

BINARY="$ROOT/src-tauri/target/release/bcp"
[ -x "$BINARY" ] || { echo "error: $BINARY not found, run desktop:build first" >&2; exit 1; }

OUT_NAME="bcp-linux-${ARCH}.tar.gz"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

STAGE="$WORK/bcp-$VERSION"
mkdir -p "$STAGE/bin" "$STAGE/icons"

cp "$BINARY" "$STAGE/bin/bcp"
cp "$ROOT/packaging/linux/bcp.desktop.in" "$STAGE/bcp.desktop"
cp "$ROOT/src-tauri/icons/32x32.png" "$STAGE/icons/32.png"
cp "$ROOT/src-tauri/icons/128x128.png" "$STAGE/icons/128.png"

tar -C "$WORK" -czf "$ROOT/$OUT_NAME" "bcp-$VERSION"
echo "Wrote $ROOT/$OUT_NAME ($(du -h "$ROOT/$OUT_NAME" | cut -f1))"
