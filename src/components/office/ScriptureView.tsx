import { StyleSheet, Text, View } from "react-native";
import type { KjvPassage } from "../../lib/content/types";

const SERIF = '"Crimson Pro", Georgia, "Times New Roman", serif';
const SERIF_ITALIC =
  '"Crimson Pro Italic", "Crimson Pro", Georgia, "Times New Roman", serif';

function Verse({ verse }: { verse: KjvPassage["verses"][number] }) {
  return (
    <Text style={styles.verse}>
      <Text style={styles.verseNumber}>{verse.number}</Text>
      {verse.text}
    </Text>
  );
}

export function ScriptureView({ passage }: { passage: KjvPassage }) {
  const reference = `${passage.book} ${passage.chapter}:${passage.verses[0]?.number}${passage.verses.length > 1 ? `–${passage.verses[passage.verses.length - 1].number}` : ""}`;

  return (
    <View style={styles.block}>
      <Text style={styles.reference}>{reference}</Text>
      {passage.verses.map((v) => (
        <Verse key={v.number} verse={v} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 8,
    marginBottom: 16,
  },
  reference: {
    fontFamily: SERIF_ITALIC,
    fontSize: 15,
    lineHeight: 22,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 6,
  },
  verse: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 29,
    color: "var(--text, #2c2020)",
    marginBottom: 4,
  },
  verseNumber: {
    fontFamily: SERIF,
    fontSize: 12,
    lineHeight: 16,
    color: "var(--text-secondary, #7a6e64)",
    marginRight: 3,
    fontWeight: "400",
  },
});
