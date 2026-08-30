import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { tokenizeSanctoraleMentions } from "../../lib/calendar/sanctorale";
import { useSaintPopover } from "./SaintPopover";

// a text run with saint names rendered as tappable mentions. saints are
// linked by exact-case surface (word-boundary guarded), so first names in
// prose ("we bring before you all you saints" style bodies) never fire.
// the commemoration of the day is picked out in a stronger accent.
export function MentionedText({
  text,
  todaySlug,
}: {
  text: string;
  todaySlug?: string;
}) {
  const { openSaint } = useSaintPopover();
  const runs = useMemo(() => tokenizeSanctoraleMentions(text), [text]);
  // keyed by text start-offset (not the array index): unique and stable
  // even when the same surface repeats, and purely positional
  let cursor = 0;
  return (
    <>
      {runs.map((run) => {
        const key = cursor;
        cursor += run.text.length;
        if (!run.entry) return <Text key={key}>{run.text}</Text>;
        const entry = run.entry;
        return (
          <Text
            key={key}
            onPress={(e) =>
              openSaint(entry.slug, e.nativeEvent.pageX, e.nativeEvent.pageY)
            }
            style={[
              styles.mention,
              entry.slug === todaySlug && styles.mentionToday,
            ]}
            accessibilityRole="button"
          >
            {run.text}
          </Text>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  mention: {
    color: "var(--accent, #7a3040)",
    textDecorationLine: "underline" as const,
    textDecorationColor: "var(--accent, #7a3040)",
    textDecorationStyle: "solid" as const,
    cursor: "pointer",
  },
  mentionToday: {
    fontWeight: "600",
  },
});
