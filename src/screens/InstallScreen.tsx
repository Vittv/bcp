import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CodeBlock } from "../components/CodeBlock";
import { ExternalLink } from "../components/ExternalLink";
import { CHROME_FONT } from "../lib/fonts";
import { LINUX_INSTALL_URL, LINUX_TARBALL, RELEASE_PAGE } from "../lib/release";
import { VERSION } from "../lib/version";

// Chrome and friends fire beforeinstallprompt when the page is installable;
// capturing it lets the app offer install inline instead of relying on the
// browser's menu. Safari and Firefox never fire it, so the button stays hidden
// and the manual instructions below cover those paths.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function useInstallPrompt() {
  const [available, setAvailable] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const eventRef = useRef<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // installed PWAs run under a standalone display mode (or navigator.standalone
    // on iOS); there is nothing left to install, so the buttons must not appear
    const updateStandalone = () => {
      const modes = ["standalone", "fullscreen", "minimal-ui"];
      const inApp =
        modes.some((m) => window.matchMedia(`(display-mode: ${m})`).matches) ||
        ("standalone" in navigator &&
          (navigator as { standalone?: boolean }).standalone === true);
      setStandalone(inApp);
    };
    updateStandalone();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", updateStandalone);

    const onBip = (e: Event) => {
      e.preventDefault();
      eventRef.current = e as InstallPromptEvent;
      setAvailable(true);
    };
    const onInstalled = () => {
      setAvailable(false);
      updateStandalone();
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      mq.removeEventListener?.("change", updateStandalone);
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    const ev = eventRef.current;
    if (!ev) return;
    setAvailable(false);
    eventRef.current = null;
    await ev.prompt();
    await ev.userChoice.catch(() => {});
  };

  return { available, standalone, install };
}

export function InstallScreen() {
  const prompt = useInstallPrompt();
  const [installHint, setInstallHint] = useState(false);

  const onAndroidPress = () => {
    if (prompt.available) {
      prompt.install();
    } else {
      setInstallHint(true);
    }
  };

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
          bcp is available as an installable web app that runs offline with its
          own launcher icon.
        </Text>
        <Text style={styles.browserNote}>
          Chrome, Edge, Samsung Internet and Opera can install the app; Firefox
          on Android doesn't support installing, so use the menu there instead.
        </Text>
        {prompt.standalone ? (
          <Text style={styles.installedBadge}>Installed on this device</Text>
        ) : (
          <>
            <Pressable
              onPress={onAndroidPress}
              accessibilityRole="button"
              accessibilityLabel="Install bcp app"
              style={({ hovered }) => [
                styles.installBtn,
                hovered && styles.installBtnHover,
              ]}
            >
              <Text style={styles.installText}>Install bcp</Text>
            </Pressable>
            {installHint && (
              <Text style={styles.hint}>
                Your browser isn't offering install for this page right now; use
                the menu's Install option instead.
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>iOS</Text>
        <Text style={styles.body}>
          On iPhone and iPad, bcp is a home-screen web app. To add it, open the
          app in Safari, tap the Share button, then choose Add to Home Screen
          and confirm. It launches full-screen from its own icon and works
          offline.
        </Text>
        <Text style={styles.browserNote}>
          This works in Safari only. Chrome and Firefox on iOS are WebKit-based,
          so their Add to Home Screen is a bookmark, not an app.
        </Text>
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
  installBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg-raised, #ece7dd)",
    textDecorationLine: "none",
  },
  installBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  installText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 16,
    letterSpacing: 0.3,
    color: "var(--accent, #7a3040)",
  },
  installedBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg-raised, #ece7dd)",
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
  },
  hint: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 20,
    marginTop: 10,
  },
  browserNote: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 20,
    marginBottom: 8,
  },
});
