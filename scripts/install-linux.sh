#!/usr/bin/env bash
#
# Rootless installer for the bcp Linux desktop app.
#
# Downloads the rootless tarball from a GitHub Release, places the binary on
# the user's PATH (~/.local/bin), installs the desktop entry and icons into the
# XDG user directories, and registers the app in the desktop menu. No root, no
# FUSE, no AppImage.
#
# Usage:
#   curl -LsS https://raw.githubusercontent.com/Vittv/bcp/main/scripts/install-linux.sh | bash
#   bash scripts/install-linux.sh --version 0.2.0
#   bash scripts/install-linux.sh --uninstall
#
# Defaults to the newest published release.

set -eu

REPO="Vittv/bcp"
PROJECT="bcp"
ARCH="${BCP_ARCH:-x86_64}"
BASE_URL="https://github.com/${REPO}/releases/latest/download"
PWA_URL="${BCP_PWA_URL:-https://vittv.github.io/bcp/}"
ICON_URL="https://raw.githubusercontent.com/${REPO}/main/public/icons/icon-192.png"

VERSION=""
UNINSTALL=false
PWA=false

resolve_home() {
  case "$1" in
    '~/'*) printf '%s/%s\n' "$HOME" "${1#\~/}" ;;
    *)     printf '%s\n' "$1" ;;
  esac
}

BIN_DIR="$(resolve_home '~/.local/bin')"
APP_DIR="$(resolve_home '~/.local/share/bcp')"
DATA_DIR="$(resolve_home '~/.local/share/applications')"
ICON_DIR="$(resolve_home '~/.local/share/icons/hicolor')"

log() { printf '%s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<EOF
Usage: $0 [options]

Installs or removes the bcp desktop app for the current user (no root).

Options:
  -v, --version VERSION   Install a specific version (default: latest)
  --pwa                   Install a Chromium app window for the hosted PWA
                          instead of the native binary. On Linux WebKitGTK
                          fonts can render poorly, so this is the fixture
                          for pixel-identical browser text.
  --uninstall             Remove the installed files
  -h, --help              Show this help and exit

Environment:
  BCP_ARCH                 Target architecture (default: x86_64)
  BCP_BROWSER              Chromium-family binary for --pwa (default: auto)
  BCP_PWA_URL              App URL for --pwa (default: the GitHub Pages PWA)
EOF
  exit 0
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -h|--help) usage ;;
      --uninstall) UNINSTALL=true ;;
      --pwa) PWA=true ;;
      -v|--version)
        if [ "$#" -lt 2 ]; then die "--version requires a value"; fi
        VERSION="$2"
        shift
        ;;
      *) die "unknown argument: $1 (try --help)" ;;
    esac
    shift
  done
}

install_icons() {
  # $1 is the tarball's icon directory (icons/32.png, icons/128.png)
  for size in 32 128; do
    src="$1/$size.png"
    [ -f "$src" ] || continue
    mkdir -p "$ICON_DIR/${size}x${size}/apps"
    cp "$src" "$ICON_DIR/${size}x${size}/apps/bcp.png"
    chmod 0644 "$ICON_DIR/${size}x${size}/apps/bcp.png"
    log "  icon ${size}x${size}"
  done
}

install_from_dir() {
  # $1 is a payload directory containing bin/bcp, bcp.desktop, icons/
  payload="$1"
  log "Installing bcp to $APP_DIR"
  mkdir -p "$APP_DIR" "$BIN_DIR" "$DATA_DIR"
  cp "$payload/bin/bcp" "$APP_DIR/bcp"
  chmod 0755 "$APP_DIR/bcp"
  ln -sf "$APP_DIR/bcp" "$BIN_DIR/bcp"

  sed "s|__BCP_BIN__|$BIN_DIR|" "$payload/bcp.desktop" > "$DATA_DIR/bcp.desktop"
  chmod 0644 "$DATA_DIR/bcp.desktop"
  log "  desktop entry -> $DATA_DIR/bcp.desktop"

  install_icons "$payload/icons"

  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DATA_DIR" >/dev/null 2>&1 || true
  fi
  log "Installed. Launch with: bcp"
}

find_browser() {
  if [ -n "${BCP_BROWSER:-}" ]; then
    command -v "$BCP_BROWSER" >/dev/null 2>&1 || die "BCP_BROWSER '$BCP_BROWSER' not found"
    printf '%s\n' "$BCP_BROWSER"
    return
  fi
  for browser in google-chrome-stable google-chrome chromium chromium-browser; do
    if command -v "$browser" >/dev/null 2>&1; then
      printf '%s\n' "$browser"
      return
    fi
  done
  die "no Chromium-family browser found for --pwa (set BCP_BROWSER)"
}

install_pwa() {
  # $1 is the browser binary that opens the PWA in its own app window
  browser="$1"
  profile_dir="$(resolve_home '~/.local/share/bcp/chromium')"

  log "Installing ${browser} app window for $PWA_URL"
  mkdir -p "$APP_DIR" "$DATA_DIR" "$ICON_DIR/128x128/apps" "$profile_dir"
  cp "$work/icon.png" "$ICON_DIR/128x128/apps/bcp.png"
  chmod 0644 "$ICON_DIR/128x128/apps/bcp.png"

  cat > "$DATA_DIR/bcp.desktop" <<EOF
[Desktop Entry]
Name=bcp
Comment=1979 Book of Common Prayer daily office reader (Chromium)
Exec="$browser" --app="$PWA_URL" --user-data-dir="$profile_dir" --no-first-run
Icon=bcp
Terminal=false
Type=Application
Categories=Education;Office;
StartupWMClass=bcp
EOF
  chmod 0644 "$DATA_DIR/bcp.desktop"
  log "  desktop entry -> $DATA_DIR/bcp.desktop"

  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DATA_DIR" >/dev/null 2>&1 || true
  fi
  log "Installed. Launch bcp from your app menu, or run: ${browser} --app='${PWA_URL}'"
}

uninstall() {
  log "Removing bcp"
  rm -f "$BIN_DIR/bcp" "$DATA_DIR/bcp.desktop"
  for size in 32 128; do
    rm -f "$ICON_DIR/${size}x${size}/apps/bcp.png"
  done
  rm -rf "$APP_DIR"
  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DATA_DIR" >/dev/null 2>&1 || true
  fi
  log "Removed."
}

main() {
  parse_args "$@"

  if [ "$UNINSTALL" = "true" ]; then
    uninstall
    exit 0
  fi

  command -v curl >/dev/null 2>&1 || die "curl is required"
  command -v sed >/dev/null 2>&1 || die "sed is required"

  work="$(mktemp -d)"
  trap 'rm -rf "$work"' EXIT

  if [ "$PWA" = "true" ]; then
    browser="$(find_browser)"
    log "Fetching the app icon"
    curl -fsSL "$ICON_URL" -o "$work/icon.png" || die "icon download failed"
    install_pwa "$browser"
    exit 0
  fi

  command -v tar >/dev/null 2>&1 || die "tar is required"

  if [ -n "$VERSION" ]; then
    tarball_url="https://github.com/${REPO}/releases/download/v${VERSION}/${PROJECT}-linux-${ARCH}.tar.gz"
  else
    tarball_url="${BASE_URL}/${PROJECT}-linux-${ARCH}.tar.gz"
  fi

  log "Downloading $tarball_url"
  curl -fsSL "$tarball_url" -o "$work/bcp.tar.gz" || die "download failed"
  tar -xzf "$work/bcp.tar.gz" -C "$work" || die "extract failed"

  payload=""
  for cand in "$work"/*/; do
    if [ -e "$cand/bin/bcp" ]; then payload="$cand"; break; fi
  done
  [ -n "$payload" ] || die "tarball did not contain a bcp payload"

  install_from_dir "$payload"
}

main "$@"
