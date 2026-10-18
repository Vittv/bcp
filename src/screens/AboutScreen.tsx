import type { CSSProperties } from "react";
import { Text, View } from "react-native";
import { ExternalLink } from "../components/ExternalLink";
import { REPO_URL } from "../components/shell/Sidebar";
import { CHROME_FONT } from "../lib/fonts";
import { KO_FI_URL, RELEASE_PAGE } from "../lib/release";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../lib/theme/themedStyles";
import { useAppVersion } from "../lib/version";

const KO_FI_ICON = require("../../assets/app_icons/ko-fi.png");

export function AboutScreen() {
  const version = useAppVersion();
  const styles = useThemedStyles(styleDef);
  const v = useThemeVar();
  // the links and the donate row render as plain web anchors and an image
  // (ExternalLink creates <a> directly), so their style objects are real CSS
  // properties rather than react-native sheet entries; the accent resolves
  // through the theme like every other color
  const web: Record<string, CSSProperties> = {
    link: {
      fontFamily: CHROME_FONT,
      fontWeight: "400",
      fontSize: 15,
      color: v("var(--accent)"),
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
  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.label}>BCP</Text>
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
          BCP is free and always will be: no ads, no accounts, no paywall, now
          or in the future.
        </Text>
        <Text style={styles.body}>
          All the liturgical content it reads is in the public domain; the app's
          own code is MIT. The Daily Office lectionary tables are adapted from
          Reuben Lillie's MIT-licensed project, corrected locally against the
          printed Prayer Book.
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
          Contribute to BCP
        </ExternalLink>
        <ExternalLink href={REPO_URL} style={web.link}>
          Source code on GitHub
        </ExternalLink>
        <ExternalLink
          href={`${REPO_URL}/blob/main/public/licenses/THIRD-PARTY-NOTICES.txt`}
          style={web.link}
        >
          Third-party notices
        </ExternalLink>
        <ExternalLink href={KO_FI_URL} style={web.donateLink}>
          <span style={web.link}>
            If BCP is useful to you, support it on Ko-fi
          </span>
          <img src={KO_FI_ICON} alt="Ko-fi" style={web.donateIcon} />
        </ExternalLink>
        <Text style={styles.value}>Version {version}</Text>
      </View>
    </View>
  );
}

const styleDef = defineThemedStyles({
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
    color: "var(--text)",
    marginBottom: 8,
  },
  value: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 14,
    color: "var(--text-secondary)",
    marginBottom: 8,
    marginTop: 12,
  },
  body: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary)",
    lineHeight: 23,
    marginBottom: 8,
  },
});
