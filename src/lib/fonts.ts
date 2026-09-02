export const SYSTEM_UI =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const INTER_TIGHT = "Inter Tight";

export const CHROME_FONT = `var(--chrome-font, ${INTER_TIGHT})`;

// expo-font registers each face as its own single-face family, so each
// weight/style needs its own leading named face with the others as fallback.
export const SERIF_FONT = '"Crimson Pro", Georgia, "Times New Roman", serif';
export const SERIF_SEMI_FONT =
  '"Crimson Pro SemiBold", "Crimson Pro", Georgia, "Times New Roman", serif';
export const SERIF_ITALIC_FONT =
  '"Crimson Pro Italic", "Crimson Pro", Georgia, "Times New Roman", serif';

export const HEADING_FONT =
  '"Playfair Display", "Crimson Pro", Georgia, "Times New Roman", serif';
