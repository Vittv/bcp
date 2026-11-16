import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_ITALIC_FONT,
} from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const RITE_LABELS: Record<string, string> = {
  traditional: "Traditional (Rite I)",
  contemporary: "Contemporary (Rite II)",
};

export const sanctoraleCardStyles = defineThemedStyles({
  group: {
    marginBottom: 22,
  },
  // the time labels drop the shared subheading's top margin: the section rule
  // already closes over the first one, and the gap between morning and evening
  // belongs to the group break, not to the label
  timeGroups: {
    gap: 30,
  },
  timeLabel: {
    marginTop: 0,
  },
  // consecutive psalms sit apart; the leading one after a time marker adds no
  // top margin of its own, so the shared subheading above keeps its small gap
  // below and hugs the psalm it introduces
  psalmBlock: {
    marginTop: 16,
  },
  blockFirst: {
    marginTop: 0,
  },
  psalmRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 22,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  lessonRow: {
    marginTop: 16,
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 16,
    lineHeight: 24,
    color: "var(--text-secondary)",
  },
  // a citation that resolves to no text stays put, in quiet italic, rather
  // than leaving a dangling label over empty space
  lessonMissing: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 13,
    lineHeight: 20,
    color: "var(--text-secondary)",
    marginTop: 2,
  },
  collect: {
    marginBottom: 20,
  },
  // the collect's own title leads the block as a serif heading; ink
  // stays in the paper colour so it reads as text, not a link
  collectTitle: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 16,
    lineHeight: 24,
    color: "var(--text)",
    marginTop: 8,
    marginBottom: 12,
  },
  // the rite markers stay small and muted so "Collect of the Day" leads
  // the block; the red belongs to the section heading
  collectRite: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    marginBottom: 4,
  },
  collectText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
  },
  detailTitle: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 30,
    lineHeight: 38,
    color: "var(--text)",
    marginBottom: 4,
  },
  detailSubtitle: {
    fontFamily: "var(--ui-font, system-ui)",
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 22,
  },
  // the biographical note leads the card, set in the same serif voice as
  // the collect so it reads as a printed life, not machine metadata
  bioText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
    marginBottom: 22,
  },
  linkRow: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginLeft: -6,
  },
  link: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "600",
    color: "var(--accent)",
  },
});
