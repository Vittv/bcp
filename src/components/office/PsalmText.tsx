import { StyleSheet, Text, View } from "react-native";
import type { PsalmPassage } from "../../lib/content/types";

const MEDIANT = "\u2009"; // thin space for the pointing asterisk

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
  block: {
    marginTop: 4,
    marginBottom: 12,
  },
  verse: {
    fontFamily: "serif",
    fontSize: 17,
    lineHeight: 27,
    color: "#1c1c1c",
  },
  verseNumber: {
    fontSize: 10,
    lineHeight: 14,
    color: "#8a8a8a",
    marginRight: 4,
    fontWeight: "400",
  },
  mediant: {
    fontSize: 17,
  },
  stanza: {
    fontStyle: "italic",
    color: "#444",
  },
});
