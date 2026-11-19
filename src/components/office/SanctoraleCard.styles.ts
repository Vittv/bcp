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
  // feast-card subheadings hug the Appointment/Collect text they introduce
  tightSubheading: {
    marginTop: 18,
    marginBottom: 2,
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
  // the collect's own title sits under the section rule as a subheading
  collectTitleAsSubheading: {
    marginTop: 0,
    marginBottom: 12,
  },
  // rite markers styled like the Collects page, scaled down to fit the card
  collectRite: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "700",
    color: "var(--accent)",
    marginBottom: 6,
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
  // a lesser feast's name is a block title, not the page heading, so it keeps
  // the shared subheading voice with its opening top margin dropped
  lesserFeastTitle: {
    marginTop: 0,
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
