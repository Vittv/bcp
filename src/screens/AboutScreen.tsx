import type { CSSProperties } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ExternalLink } from "../components/ExternalLink";
import { REPO_URL } from "../components/shell/Sidebar";
import { CHROME_FONT } from "../lib/fonts";
import { KO_FI_URL, RELEASE_PAGE } from "../lib/release";
import { VERSION } from "../lib/version";

const KO_FI_ICON = require("../../assets/app_icons/ko-fi.png");

export function AboutScreen() {
  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.label}>bcp</Text>
        <Text style={styles.body}>
          A reader for the Daily Office of the Book of Common Prayer (1979, The
          Episcopal Church): Morning Prayer, Noonday Prayer, Evening Prayer, and
          Compline, composed for any date by a local liturgical calendar engine.
        </Text>
        <Text style={styles.body}>
          The whole app runs offline: the calendar, the texts, and the desktop
          shell all work without a network connection. No account, no login, no
          tracking.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Free, forever</Text>
        <Text style={styles.body}>
          bcp is free and always will be: no ads, no accounts, no paywall, now
          or in the future.
        </Text>
        <Text style={styles.body}>
          All the content it reads is in the public domain; the app code itself
          is MIT.
        </Text>
      </View>

      <View style={styles.sectionLast}>
        <Text style={styles.label}>Links</Text>
        <ExternalLink href={RELEASE_PAGE} style={web.link}>
          Get the app: download the latest release
        </ExternalLink>
        <ExternalLink
          href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
          style={web.link}
        >
          Contribute to bcp
        </ExternalLink>
        <ExternalLink href={REPO_URL} style={web.link}>
          Source code on GitHub
        </ExternalLink>
        <ExternalLink href={KO_FI_URL} style={web.donateLink}>
          <span style={web.link}>Support on Ko-fi</span>
          <img src={KO_FI_ICON} alt="Ko-fi" style={web.donateIcon} />
        </ExternalLink>
        <Text style={styles.value}>Version {VERSION}</Text>
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
    fontSize: 16,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  value: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 8,
    marginTop: 12,
  },
  body: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 23,
    marginBottom: 8,
  },
});

// the links and the donate row render as plain web anchors and an image
// (ExternalLink creates <a> directly), so their style objects are real CSS
// properties rather than react-native sheet entries
const web: Record<string, CSSProperties> = {
  link: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--accent, #7a3040)",
    textDecorationLine: "underline",
    marginBottom: 8,
  },
  donateLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    textDecorationLine: "none",
    marginBottom: 8,
  },
  donateIcon: {
    width: 20,
    height: 16,
    flexShrink: 0,
    verticalAlign: "middle",
  },
};
