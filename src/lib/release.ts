// Release metadata shared by the web Install page. The repository owner and
// name feed the GitHub Releases URL used for every platform's artifacts.
export const RELEASE_REPO = "Vittv/bcp";
export const RELEASE_PAGE = `https://github.com/${RELEASE_REPO}/releases/latest`;

// The rootless Linux tarball is the one artifact with a version-free asset
// name, so it gets a stable latest-redirecting link. The native bundles embed
// the version in their filenames and are best reached through the release page.
export const LINUX_TARBALL = `${RELEASE_PAGE}/download/bcp-linux-x86_64.tar.gz`;

export const LINUX_INSTALL_URL = `https://raw.githubusercontent.com/${RELEASE_REPO}/main/scripts/install-linux.sh`;

// The web app is the same codebase served as an installable PWA on GitHub
// Pages. iOS and Android both install it from here rather than from a native
// store build right now.
export const PWA_URL = "https://vittv.github.io/bcp/";
