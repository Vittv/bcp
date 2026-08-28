import { StyleSheet, Text, View } from "react-native";
import { CodeBlock } from "../components/CodeBlock";
import { ExternalLink } from "../components/ExternalLink";
import { CHROME_FONT } from "../lib/fonts";
import {
  LINUX_INSTALL_URL,
  LINUX_TARBALL,
  PWA_URL,
  RELEASE_PAGE,
} from "../lib/release";
import { VERSION } from "../lib/version";

export function InstallScreen() {
  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.body}>
          bcp is a desktop app for macOS, Windows and Linux, a web app for
          Android and iPhone, and this installable web app. Pick your platform
          below; each option installs the newest version.
        </Text>
        <ExternalLink href={RELEASE_PAGE} style={styles.link}>
          Open the latest release page
        </ExternalLink>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Linux</Text>
        <ExternalLink href={LINUX_TARBALL} style={styles.link}>
          Rootless tarball ({VERSION})
        </ExternalLink>
        <Text style={styles.body}>
          Extract a binary and desktop entry into your user directories. No root
          or AppImage needed; requires the system webview.
        </Text>
        <CodeBlock value={`curl -LsS ${LINUX_INSTALL_URL} | bash`} />
        <Text style={styles.body}>
          The installer adds the binary to your PATH, registers the app in the
          desktop menu (including its icon), and cleans up when you uninstall.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>macOS</Text>
        <Text style={styles.body}>
          Universal disk image (Apple Silicon and Intel) from the release page.
          Drag the app into Applications.
        </Text>
        <ExternalLink href={RELEASE_PAGE} style={styles.link}>
          Get the macOS app
        </ExternalLink>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Windows</Text>
        <Text style={styles.body}>
          NSIS installer (.exe) or MSI from the release page. Uses the system
          WebView2, so no separate runtime download is needed.
        </Text>
        <ExternalLink href={RELEASE_PAGE} style={styles.link}>
          Get the Windows app
        </ExternalLink>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Android</Text>
        <Text style={styles.body}>
          bcp is available as an installable web app. In Chrome, open the app
          and choose Add to Home Screen (or Install app) from the menu; it runs
          offline with its own launcher icon.
        </Text>
        <ExternalLink href={PWA_URL} style={styles.link}>
          Open the web app
        </ExternalLink>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>iOS</Text>
        <Text style={styles.body}>
          On iPhone and iPad, bcp is a web app added to the Home Screen. In
          Safari, open the app, tap Share, then choose Add to Home Screen. It
          launches full-screen from its own icon and works offline.
        </Text>
        <ExternalLink href={PWA_URL} style={styles.link}>
          Open the web app
        </ExternalLink>
      </View>

      <View style={styles.sectionLast}>
        <Text style={styles.label}>All platforms</Text>
        <Text style={styles.body}>
          .deb and .rpm packages for Debian, Ubuntu, Fedora and compatible
          distros are also on the release page.
        </Text>
      </View>

      <View style={styles.sectionLast}>
        <Text style={styles.label}>Updates</Text>
        <Text style={styles.body}>
          The desktop app checks the release page for a newer version. In
          Settings, choose Check for Updates to download and install the latest
          build, then relaunch. New releases appear there automatically.
        </Text>
        <Text style={styles.body}>
          The web app (Android and iPhone) never needs an update. It always runs
          the newest version, loading fresh content on every visit, so there is
          nothing to install.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionLast: {
    marginBottom: 24,
  },
  label: {
    fontFamily: CHROME_FONT,
    fontSize: 18,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  body: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 17,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 27,
    marginBottom: 8,
  },
  link: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 17,
    color: "var(--accent, #7a3040)",
    textDecorationLine: "underline",
    marginBottom: 8,
  },
});
