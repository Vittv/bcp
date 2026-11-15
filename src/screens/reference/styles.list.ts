import { CHROME_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const listStyles = defineThemedStyles({
  list: {
    flexGrow: 1,
  },
  // file-manager rows: full-width hover bands; the
  // 18px padding sits the search text and row text on the same left edge
  row: {
    position: "relative",
  },
  // the tiny red ▸ cursor that marks the active row, aligned with the
  // search field's text (16px inset) and drawn in the gutter the item
  // rows indent by, exactly like the aetheryte picker's selected arrow
  pickerCursor: {
    position: "absolute",
    left: 16,
    top: "50%",
    marginTop: -8,
    fontSize: 14,
    lineHeight: 16,
    color: "var(--accent)",
  },
  rowHover: {
    backgroundColor: "var(--control-hover)",
  },
  // picked rows turn every text node accent red instead of painting a
  // background fill; hover paints the rowHover fill on top of that state.
  // the keyboard cursor lights the same text nodes, so arrows are visible
  rowTextActive: {
    color: "var(--accent)",
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 34,
    paddingRight: 18,
  },
  // psalm rows pin their geometry to match the collect rows exactly:
  // 18px incipit line + 2×8px padding + 1px hairline = 35px, same as
  // collectIndexTitle's 18 + 2×8 + 1
  psalmRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 34,
    paddingRight: 18,
  },
  rowMeta: {
    marginLeft: "auto",
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    fontVariant: ["tabular-nums"],
  },
  // the reader's own state in a row's trailing slot, where the bare counts
  // beside it are facts about the item. accent, because it is about the
  // reader; the wording carries it too, so colour is never the only cue
  rowMetaReading: {
    color: "var(--accent)",
  },
  rowChevron: {
    opacity: 0,
  },
  rowChevronShown: {
    opacity: 1,
  },
  indexBody: {
    // the split-pane variant still pads the tail, but the palette needs
    // no extra space (the list ends exactly at the last row)
  },
  // headings sit on the cursor arrow's 16px track so the active-row ▸
  // points up into its category; item rows keep their deeper 34px gutter
  groupHeadingIndex: {
    paddingLeft: 16,
  },
  // collect titles are navigation labels rather than prayed text, so
  // they stay sans; like the sidebar nav they sit in the muted
  // secondary ink, and the serif is reserved for the compare view
  collectIndexTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: "var(--text-secondary)",
    flex: 1,
  },
  collectRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 34,
    paddingRight: 18,
  },
  // saint rows carry a short date pinned to the trailing edge so the
  // calendar races itself at a glance while titles keep the ragged-left
  // edge; the min-width keeps the right-aligned column tidy
  saintRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 34,
    paddingRight: 18,
  },
  saintDate: {
    minWidth: 44,
    flexShrink: 0,
    textAlign: "right",
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--accent)",
    fontVariant: ["tabular-nums"],
  },
  saintTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: "var(--text-secondary)",
    flex: 1,
  },
  // canticle titles are proper names (The Song of Mary, Nunc Dimittis)
  // rather than first-line incipits, so the picker lists them in the same
  // sans navigation voice as collects and saints; the pair keeps the row at
  // the pinned 35px (18px line + 2×8 padding + hairline)
  canticleIndexTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: "var(--text-secondary)",
    flex: 1,
  },
  // the canticle picker lists titles only, no number gutter: every row
  // reads title + verse count on the same edge as the other pickers
  // rites always print one above the other at full measure: the
  // horizontal wrap is only useful at extreme widths and fights the
  // 736px column language
  compareRow: {
    gap: 24,
  },
  // rites stack at full measure; each block sizes to its own text
  compareCol: {},
  compareRite: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--accent)",
    marginBottom: 10,
  },
  // fixed-width gutter keeps every incipit on the same edge while the
  // number itself sits flush left, lined up with the search text; digits
  // read in content ink, never red
  psalmNumber: {
    width: 28,
    textAlign: "left",
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    color: "var(--text)",
    fontVariant: ["tabular-nums"],
  },
  incipit: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: "var(--text-secondary)",
    flex: 1,
  },
  empty: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  // detail views keep a readable measure but sit hard left, unlike the
  // centered document column used by the Today page
  // detail column matches Today and the offices browser: same
  // 46rem-equivalent measure, centered via auto margins in both the
  // split pane and mobile wrapper
});
