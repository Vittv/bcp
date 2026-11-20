import { Pressable, Text, View } from "react-native";
import type { FeastIdentity } from "../../lib/calendar/feastsByTradition";
import { feastMonthDayLabel } from "../../lib/calendar/feastsByTradition";
import { wikipediaSearchUrl } from "../../lib/calendar/lesserFeastWiki";
import { CHROME_FONT, HEADING_FONT, SERIF_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSubheading } from "./contentHeadings";

// the older churches' holy days carry a name and a printed date but no vendored
// propers, so their cards stay to what the witness actually supplies.
export function HolyDayCard({ feast }: { feast: FeastIdentity }) {
  const styles = useThemedStyles(styleDef);
  const subheading = useSubheading();
  const date = feastMonthDayLabel(feast.month, feast.day);
  return (
    <View>
      <Text style={[subheading, styles.title]}>{feast.name}</Text>
      <Text style={styles.subtitle}>
        {feast.calendar}
        {"\n"}
        {date}
      </Text>
      <Text style={styles.body}>
        {`Commemorated on ${date} in the ${feast.calendar} calendar.`}
      </Text>
      <Pressable
        style={styles.linkRow}
        onPress={() =>
          window.open(wikipediaSearchUrl(feast.name), "_blank", "noreferrer")
        }
        accessibilityRole="link"
        accessibilityLabel={`Search Wikipedia for ${feast.name}`}
      >
        {({ hovered }) => (
          <Text style={[styles.link, hovered && styles.linkHover]}>
            Search Wikipedia
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styleDef = defineThemedStyles({
  title: {
    fontFamily: HEADING_FONT,
    fontSize: 24,
    color: "var(--text)",
  },
  subtitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 20,
  },
  body: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    lineHeight: 26,
    color: "var(--text)",
  },
  linkRow: {
    paddingVertical: 8,
  },
  link: {
    fontFamily: CHROME_FONT,
    fontSize: 14,
    color: "var(--accent)",
    textDecorationLine: "underline",
  },
  linkHover: {
    textDecorationLine: "none",
  },
});
