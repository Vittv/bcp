import { Text, View } from "react-native";
import type { KjvPassage } from "../../lib/content/types";
import {
  SERIF_FONT,
  SERIF_ITALIC_FONT,
  SERIF_SEMI_FONT,
} from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

function Verse({ verse }: { verse: KjvPassage["verses"][number] }) {
  const styles = useThemedStyles(scriptureStyles);
  return (
    <Text style={styles.verse}>
      <Text style={styles.verseNumber}>{verse.number}</Text>
      {verse.text}
    </Text>
  );
}

export function ScriptureView({ passage }: { passage: KjvPassage }) {
  const styles = useThemedStyles(scriptureStyles);
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

const scriptureStyles = defineThemedStyles({
  block: {
    marginTop: 8,
    marginBottom: 0,
  },
  reference: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 22,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  verse: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 29,
    color: "var(--text)",
    marginBottom: 4,
  },
  verseNumber: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    lineHeight: 16,
    color: "var(--text-secondary)",
    marginRight: 3,
    fontWeight: "400",
  },
  chapterBreak: {
    fontFamily: SERIF_SEMI_FONT,
    fontSize: 16,
    color: "var(--text-secondary)",
    marginTop: 10,
    marginBottom: 4,
  },
});
