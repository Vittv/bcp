import { StyleSheet, Text, View } from "react-native";
import type { PsalmPassage } from "../../lib/content/types";

const MEDIANT = "\u2009";

const SERIF = '"Crimson Pro", Georgia, "Times New Roman", serif';
// expo-font registers each face as its own single-face family
const SERIF_ITALIC =
  '"Crimson Pro Italic", "Crimson Pro", Georgia, "Times New Roman", serif';

function Verse({ verse }: { verse: PsalmPassage["verses"][number] }) {
  return (
    <Text style={styles.verse}>
      <Text style={styles.verseNumber}>{verse.number}</Text>
      {verse.text.replaceAll("*", MEDIANT)}
      {verse.stanza ? <Text style={styles.stanza}> {verse.stanza}</Text> : null}
    </Text>
  );
}

export function PsalmText({ passage }: { passage: PsalmPassage }) {
  return (
    <View style={styles.block}>
      {passage.verses.map((v) => (
        <Verse key={v.number} verse={v} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
  verse: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 29,
    color: "var(--text, #2c2020)",
  },
  verseNumber: {
    fontFamily: SERIF,
    fontSize: 12,
    lineHeight: 16,
    color: "var(--text-secondary, #7a6e64)",
    marginRight: 3,
    fontWeight: "400",
  },
  mediant: {
    fontSize: 17,
  },
  stanza: {
    fontFamily: SERIF_ITALIC,
    color: "var(--text-secondary, #7a6e64)",
  },
});
