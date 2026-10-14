import { FACES, faceStack, SYSTEM_UI } from "./typography/faces";

export { SYSTEM_UI };

export const INTER_TIGHT = "Inter Tight";

// the interface face follows the interface-font choice through the var the js
// resolver and the injected @font-face both write
export const CHROME_FONT = `var(--chrome-font, ${INTER_TIGHT})`;

// the reader's three registers read the reading face through the same var
// resolver, so a face change reflows the reader on web and native alike
export const SERIF_FONT = `var(--reading-font, ${faceStack(
  FACES["crimson-pro"],
  "body",
)})`;
export const SERIF_SEMI_FONT = `var(--reading-font-semibold, ${faceStack(
  FACES["crimson-pro"],
  "semibold",
)})`;
export const SERIF_ITALIC_FONT = `var(--reading-font-italic, ${faceStack(
  FACES["crimson-pro"],
  "italic",
)})`;

// the heading face follows the heading-font choice through the same var the js
// resolver and the injected @font-face both write
export const HEADING_FONT = `var(--heading-font, ${faceStack(
  FACES["playfair-display"],
  "body",
)})`;
