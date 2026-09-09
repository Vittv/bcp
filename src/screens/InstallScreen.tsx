import { StyleSheet, Text, View } from "react-native";
import { CodeBlock } from "../components/CodeBlock";
import { ExternalLink } from "../components/ExternalLink";
import { Note } from "../components/Note";
import { Step, Steps } from "../components/Steps";
import { CHROME_FONT } from "../lib/fonts";
import { LINUX_INSTALL_URL, LINUX_TARBALL, PWA_URL, RELEASE_PAGE } from "../lib/release";
import { VERSION } from "../lib/version";

const FIREFOXPWA_URL = "https://github.com/filips123/PWAsForFirefox";

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

      <View style={styles.sectionDivider}>
        <Text style={styles.groupLabel}>Desktop</Text>
        <Text style={styles.label}>Linux</Text>
        <ExternalLink href={LINUX_TARBALL} style={styles.link}>
          Rootless tarball ({VERSION})
        </ExternalLink>
        <Text style={styles.body}>
          Needs no root or AppImage; requires the system webview.
        </Text>
        <CodeBlock value={`curl -LsS ${LINUX_INSTALL_URL} | bash`} />
        <Text style={styles.body}>
          Adds the binary to your PATH, registers the app in the desktop menu
          (including its icon), and cleans up on uninstall.
        </Text>
        <Note>
          <Text style={styles.noteText}>
            The native app renders with the system WebKitGTK. If fonts look
            wrong, use the Web app (PWA) option instead.
          </Text>
        </Note>
        <Text style={styles.subLabel}>Debian, Ubuntu, Fedora</Text>
        <Text style={styles.body}>
          .deb and .rpm packages for Debian, Ubuntu, Fedora and compatible
          distros are also on the release page.
        </Text>
        <ExternalLink href={RELEASE_PAGE} style={styles.link}>
          Open the .deb and .rpm packages
        </ExternalLink>
        <Text style={[styles.label, styles.labelSpaced]}>macOS</Text>
        <Text style={styles.body}>
          Universal disk image (Apple Silicon and Intel) from the release page.
          Drag the app into Applications.
        </Text>
        <ExternalLink href={RELEASE_PAGE} style={styles.link}>
          Get the macOS app
        </ExternalLink>
        <Text style={[styles.label, styles.labelSpaced]}>Windows</Text>
        <Text style={styles.body}>
          NSIS installer (.exe) or MSI from the release page. Uses the system
          WebView2, so no separate runtime download is needed.
        </Text>
        <ExternalLink href={RELEASE_PAGE} style={styles.link}>
          Get the Windows app
        </ExternalLink>
        <Note>
          <Text style={styles.noteText}>
            The installers aren't code-signed, so Windows SmartScreen will warn
            on first launch. Click More info, then Run anyway.
          </Text>
        </Note>
      </View>

      <View style={styles.sectionDivider}>
        <Text style={styles.groupLabel}>Web app (PWA)</Text>
        <Text style={styles.label}>Any OS</Text>
        <Text style={styles.body}>
          bcp runs in any modern browser and installs into its own window with
          its own launcher icon.
        </Text>
        <Steps>
          <Step n={1}>
            Open{" "}
            <ExternalLink href={PWA_URL} style={styles.inlineLink}>
              bcp
            </ExternalLink>{" "}
            in a Chromium-based browser.
          </Step>
          <Step n={2}>Click the install icon at the right end of the address bar.</Step>
          <Step n={3}>Confirm the install prompt.</Step>
        </Steps>
        <Note>
          <Text style={styles.noteText}>
            Firefox-based browsers can't install web apps; add the{" "}
            <ExternalLink href={FIREFOXPWA_URL} style={styles.link}>
              firefoxpwa connector
            </ExternalLink>{" "}
            first, then install bcp from the browser's menu.
          </Text>
        </Note>
      </View>

      <View style={styles.sectionDivider}>
        <Text style={styles.groupLabel}>Mobile (PWA)</Text>
        <Text style={styles.label}>Android</Text>
        <Steps>
          <Step n={1}>
            Open{" "}
            <ExternalLink href={PWA_URL} style={styles.inlineLink}>
              bcp
            </ExternalLink>{" "}
            in any browser.
          </Step>
          <Step n={2}>Tap the Menu, then Install app or Add to Home Screen.</Step>
        </Steps>
        <Note>
          <Text style={styles.noteText}>
            On some older phones Firefox needs a small home-screen helper app
            first; it offers to install it when you try to install a web app.
          </Text>
        </Note>
        <Text style={[styles.label, styles.labelSpaced]}>iPhone and iPad</Text>
        <Steps>
          <Step n={1}>
            Open{" "}
            <ExternalLink href={PWA_URL} style={styles.inlineLink}>
              bcp
            </ExternalLink>{" "}
            in Safari.
          </Step>
          <Step n={2}>Tap Share, then Add to Home Screen.</Step>
        </Steps>
        <Note>
          <Text style={styles.noteText}>
            This works in Safari only. Chrome and Firefox on iOS are
            WebKit-based, so their Add to Home Screen is a bookmark, not an
            app.
          </Text>
        </Note>
      </View>

      <View style={styles.sectionDivider}>
        <Text style={styles.groupLabel}>Updates</Text>
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
    marginBottom: 30,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: "var(--border-content, #b5aa9e)",
    paddingTop: 20,
    marginBottom: 30,
  },
  groupLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 20,
    fontWeight: "700",
    color: "var(--text, #2c2020)",
    marginBottom: 16,
  },
  label: {
    fontFamily: CHROME_FONT,
    fontSize: 15,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  labelSpaced: {
    marginTop: 24,
  },
  subLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  body: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 23,
    marginBottom: 8,
  },
  link: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--accent, #7a3040)",
    textDecorationLine: "underline",
    marginBottom: 8,
  },
  inlineLink: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--accent, #7a3040)",
    textDecorationLine: "underline",
  },
  noteText: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 21,
  },
});
