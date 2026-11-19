import { SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

// the reading voice shared by every edition's office; 1979 sets the values and
// the other editions add only the spacing their printed pages need
export const officeDocumentStyles = defineThemedStyles({
  section: { marginBottom: 20 },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content)",
  },
  headingText: {
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  text: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text)",
  },
  textPeople: { fontWeight: "700" },
  rubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 25,
    color: "var(--text-secondary)",
    marginTop: 4,
    marginBottom: 4,
  },
  speaker: {
    fontFamily: SERIF_FONT,
    fontWeight: "600",
    fontSize: 15,
    color: "var(--accent)",
  },
  accent: { color: "var(--accent)" },
  lessonRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
  },
  notes: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "var(--border-content)",
  },
  noteText: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 13,
    lineHeight: 20,
    color: "var(--text-secondary)",
    marginTop: 2,
  },
});
