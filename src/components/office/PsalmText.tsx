import { Text, View } from "react-native";
import type { PsalmPassage } from "../../lib/content/types";
import { SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

const MEDIANT = "\u2009";

function Verse({ verse }: { verse: PsalmPassage["verses"][number] }) {
  const styles = useThemedStyles(psalmStyles);
  return (
    <Text style={styles.verse}>
      <Text style={styles.verseNumber}>{verse.number}</Text>
      {verse.text.replaceAll("*", MEDIANT)}
      {verse.stanza ? <Text style={styles.stanza}> {verse.stanza}</Text> : null}
    </Text>
  );
}

export function PsalmText({ passage }: { passage: PsalmPassage }) {
  const styles = useThemedStyles(psalmStyles);
  return (
    <View style={styles.block}>
      {passage.verses.map((v) => (
        <Verse key={v.number} verse={v} />
      ))}
    </View>
  );
}

const psalmStyles = defineThemedStyles({
  block: {},
  verse: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 29,
    color: "var(--text)",
  },
  verseNumber: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    lineHeight: 16,
    color: "var(--text-secondary)",
    marginRight: 3,
    fontWeight: "400",
  },
  mediant: {
    fontSize: 17,
  },
  stanza: {
    fontFamily: SERIF_ITALIC_FONT,
    color: "var(--text-secondary)",
  },
});
