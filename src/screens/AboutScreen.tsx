import { ScrollView, StyleSheet, Text, View } from "react-native";

export function AboutScreen() {
  return (
    <ScrollView>
      <Text style={styles.heading}>About</Text>

      <View style={styles.section}>
        <Text style={styles.label}>bcp</Text>
        <Text style={styles.body}>
          A reader for the Daily Office of the Book of Common Prayer (1979, The
          Episcopal Church): Morning Prayer, Noonday Prayer, Evening Prayer, and
          Compline, composed for any date by a local liturgical calendar engine.
        </Text>
        <Text style={styles.body}>
          The whole app runs offline: the calendar, the texts, and the desktop
          shell all work without a network connection.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Stack</Text>
        <Text style={styles.body}>
          UI: Expo and React Native for Web in TypeScript, bundled with Metro;
          the same code ships as a PWA and as the desktop app.
        </Text>
        <Text style={styles.body}>
          Desktop: Tauri 2 (Rust) wrapping the static web export, using the
          system webview (WebView2 on Windows, WKWebView on macOS, WebKitGTK on
          Linux).
        </Text>
        <Text style={styles.body}>
          Toolchain: Bun for runtime and tests, Biome and oxlint for linting and
          formatting, zod for validating vendored content at load.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Content</Text>
        <Text style={styles.body}>
          Office liturgies, the psalter (all 150 psalms), canticles, and
          collects come from the 1979 Book of Common Prayer, which is in the
          public domain.
        </Text>
        <Text style={styles.body}>
          Readings follow the Daily Office Lectionary (two-year cycle), vendored
          from an MIT-licensed JSON source and parsed locally; the liturgical
          calendar (seasons, colors, feasts) is computed from the Gregorian
          Easter computus.
        </Text>
        <Text style={styles.body}>
          Body text is set in Crimson Pro, licensed under the SIL Open Font
          License.
        </Text>
      </View>

      <View style={styles.sectionLast}>
        <Text style={styles.label}>License</Text>
        <Text style={styles.body}>Code: MIT. Texts: public domain.</Text>
        <Text style={styles.value}>Version 0.1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: "sans-serif",
    fontSize: 20,
    fontWeight: "700",
    color: "var(--text, #2c2020)",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLast: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "sans-serif",
    fontSize: 13,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  value: {
    fontFamily: "sans-serif",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 8,
  },
  body: {
    fontFamily: "sans-serif",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 20,
    marginBottom: 8,
  },
});
