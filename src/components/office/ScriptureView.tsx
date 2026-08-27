import { StyleSheet, Text, View } from "react-native";
import type { KjvPassage } from "../../lib/content/types";

const SERIF = '"Crimson Pro", Georgia, "Times New Roman", serif';
const SERIF_SEMI =
  '"Crimson Pro SemiBold", "Crimson Pro", Georgia, "Times New Roman", serif';
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
  const first = passage.verses[0];
  const last = passage.verses[passage.verses.length - 1];
  const spansChapters = (last?.chapter ?? passage.chapter) > passage.chapter;
  const reference = spansChapters
    ? `${passage.book} ${passage.chapter}:${first?.number}–${last?.chapter}:${last?.number}`
    : `${passage.book} ${passage.chapter}:${first?.number}${passage.verses.length > 1 ? `–${last?.number}` : ""}`;

  let runningChapter = passage.chapter;

  return (
    <View style={styles.block}>
      <Text style={styles.reference}>{reference}</Text>
      {passage.verses.map((v) => {
        const chapter = v.chapter ?? passage.chapter;
        const showBreak = chapter !== runningChapter;
        runningChapter = chapter;
        return (
          <View key={`${chapter}:${v.number}`}>
            {showBreak ? (
              <Text style={styles.chapterBreak}>{chapter}</Text>
            ) : null}
            <Verse verse={v} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 8,
    marginBottom: 0,
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
  chapterBreak: {
    fontFamily: SERIF_SEMI,
    fontSize: 16,
    color: "var(--accent, #7a3040)",
    marginTop: 10,
    marginBottom: 4,
  },
});
