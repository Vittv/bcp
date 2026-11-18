import { Pressable, Text, View } from "react-native";
import type { FeastIdentity } from "../../lib/calendar/feastsByTradition";
import { feastMonthDayLabel } from "../../lib/calendar/feastsByTradition";
import { wikipediaSearchUrl } from "../../lib/calendar/lesserFeastWiki";
import type { CalendarTradition } from "../../lib/calendar/tradition";
import { CHROME_FONT, HEADING_FONT, SERIF_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSubheading } from "./contentHeadings";

const CALENDARS: Record<CalendarTradition, string> = {
  tec: "TEC · 1979 Book of Common Prayer",
  coe: "CoE · 1662 Book of Common Prayer",
  acc: "ACC · 1962 Canadian Book of Common Prayer",
};

// the older churches' holy days carry a name and a printed date but no vendored
// propers, so their cards stay to what the witness actually supplies.
export function HolyDayCard({
  feast,
  tradition,
}: {
  feast: FeastIdentity;
  tradition: CalendarTradition;
}) {
  const styles = useThemedStyles(styleDef);
  const subheading = useSubheading();
  const date = feastMonthDayLabel(feast.month, feast.day);
  return (
    <View>
      <Text style={[subheading, styles.title]}>{feast.name}</Text>
      <Text style={styles.subtitle}>
        {CALENDARS[tradition]}
        {"\n"}
        {date}
      </Text>
      <Text style={styles.body}>
        {`Commemorated on ${date} in the ${CALENDARS[tradition]} calendar.`}
      </Text>
      <Pressable
        style={({ hovered }) => [styles.linkRow, hovered && styles.rowHover]}
        onPress={() =>
          window.open(wikipediaSearchUrl(feast.name), "_blank", "noreferrer")
        }
        accessibilityRole="link"
        accessibilityLabel={`Search Wikipedia for ${feast.name}`}
      >
        <Text style={styles.link}>{"Search Wikipedia ›"}</Text>
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
  rowHover: { opacity: 0.7 },
  link: {
    fontFamily: CHROME_FONT,
    fontSize: 14,
    color: "var(--accent)",
    textDecorationLine: "underline",
  },
});
