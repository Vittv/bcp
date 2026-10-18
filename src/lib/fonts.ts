import {
  DEFAULT_HEADING_FONT,
  DEFAULT_READING_FONT,
  DEFAULT_SUBHEADING_FONT,
  FACES,
  faceStack,
  SYSTEM_UI,
} from "./typography/faces";

export { SYSTEM_UI };

export const INTER_TIGHT = "Inter Tight";

// the interface face follows the interface-font choice through the var the js
// resolver and the injected @font-face both write
export const CHROME_FONT = `var(--chrome-font, ${INTER_TIGHT})`;

// the reader's three registers read the reading face through the same var
// resolver, so a face change reflows the reader on web and native alike
export const SERIF_FONT = `var(--reading-font, ${faceStack(
  FACES[DEFAULT_READING_FONT],
  "body",
)})`;
export const SERIF_SEMI_FONT = `var(--reading-font-semibold, ${faceStack(
  FACES[DEFAULT_READING_FONT],
  "semibold",
)})`;
export const SERIF_ITALIC_FONT = `var(--reading-font-italic, ${faceStack(
  FACES[DEFAULT_READING_FONT],
  "italic",
)})`;

// the heading face follows the heading-font choice through the same var the js
// resolver and the injected @font-face both write
export const HEADING_FONT = `var(--heading-font, ${faceStack(
  FACES[DEFAULT_HEADING_FONT],
  "body",
)})`;

// the subheading face titles every block inside a page (canticle titles,
// "A Reading", rubric groups). it reads through the semibold register so a
// static face (EB Garamond) reaches its real semibold file rather than a
// synthesized weight; a variable face reaches its axis through font-weight.
export const SUBHEADING_FONT = `var(--subheading-font, ${faceStack(
  FACES[DEFAULT_SUBHEADING_FONT],
  "semibold",
)})`;
