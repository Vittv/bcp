import { useMemo } from "react";
import { Text } from "react-native";
import {
  sanctoraleBySlug,
  tokenizeSanctoraleMentions,
} from "../../lib/calendar/sanctorale";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSaintPopover } from "./SaintPopover";

// a text run with saint names rendered as tappable mentions. saints are
// linked by exact-case surface (word-boundary guarded), so first names in
// prose ("we bring before you all you saints" style bodies) never fire.
// the commemoration of the day is picked out in a stronger accent.
export function MentionedText({
  text,
  todaySlug,
  slug,
}: {
  text: string;
  todaySlug?: string;
  /** link the whole run to this feast, whatever its printed wording. */
  slug?: string;
}) {
  const { openSaint } = useSaintPopover();
  const styles = useThemedStyles(mentionStyles);
  const runs = useMemo(() => tokenizeSanctoraleMentions(text), [text]);
  // a slug links the whole run to its feast, whatever the printed title
  const forced = slug ? sanctoraleBySlug(slug) : undefined;
  if (forced) {
    return (
      <Text
        onPress={() => openSaint(forced.slug)}
        style={[
          styles.mention,
          forced.slug === todaySlug && styles.mentionToday,
        ]}
        accessibilityRole="button"
      >
        {text}
      </Text>
    );
  }
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
            onPress={() => openSaint(entry.slug)}
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

const mentionStyles = defineThemedStyles({
  mention: {
    color: "var(--accent)",
    textDecorationLine: "underline" as const,
    textDecorationColor: "var(--accent)",
    textDecorationStyle: "solid" as const,
    cursor: "pointer",
  },
  mentionToday: {
    fontWeight: "600",
  },
});
