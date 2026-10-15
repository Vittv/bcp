import { Text, View } from "react-native";
import type { PsalmPassage } from "../../lib/content/types";
import { SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

const MEDIANT = "\u2009";

export type PsalmSize = "reading" | "body";

function Verse({
  verse,
  size,
}: {
  verse: PsalmPassage["verses"][number];
  size: PsalmSize;
}) {
  const styles = useThemedStyles(psalmStyles);
  return (
    <Text style={[styles.verse, size === "body" && styles.verseBody]}>
      <Text
        style={[styles.verseNumber, size === "body" && styles.verseNumberBody]}
      >
        {verse.number}
      </Text>
      {verse.text.replaceAll("*", MEDIANT)}
      {verse.stanza ? <Text style={styles.stanza}> {verse.stanza}</Text> : null}
    </Text>
  );
}

export function PsalmText({
  passage,
  size = "reading",
}: {
  passage: PsalmPassage;
  size?: PsalmSize;
}) {
  const styles = useThemedStyles(psalmStyles);
  return (
    <View style={styles.block}>
      {passage.verses.map((v) => (
        <Verse key={v.number} verse={v} size={size} />
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
  verseBody: {
    fontSize: 18,
    lineHeight: 30,
  },
  verseNumber: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    lineHeight: 16,
    color: "var(--text-secondary)",
    marginRight: 3,
    fontWeight: "400",
  },
  verseNumberBody: {
    fontSize: 13,
    lineHeight: 17,
  },
  mediant: {
    fontSize: 17,
  },
  stanza: {
    fontFamily: SERIF_ITALIC_FONT,
    color: "var(--text-secondary)",
  },
});
