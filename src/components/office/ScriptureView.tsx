import { Text, View } from "react-native";
import type { KjvPassage } from "../../lib/content/types";
import { SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

export type ScriptureSize = "reading" | "body";

function Verse({
  verse,
  size,
}: {
  verse: KjvPassage["verses"][number];
  size: ScriptureSize;
}) {
  const styles = useThemedStyles(scriptureStyles);
  return (
    <Text style={[styles.verse, size === "body" && styles.verseBody]}>
      <Text
        style={[styles.verseNumber, size === "body" && styles.verseNumberBody]}
      >
        {verse.number}
      </Text>
      {verse.text}
    </Text>
  );
}

export function ScriptureView({
  passage,
  size = "reading",
}: {
  passage: KjvPassage;
  size?: ScriptureSize;
}) {
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
              <Text style={styles.chapterBreak}>Chapter {chapter}</Text>
            ) : null}
            <Verse verse={v} size={size} />
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
  chapterBreak: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 25,
    color: "var(--text-secondary)",
    marginTop: 4,
    marginBottom: 4,
  },
});
