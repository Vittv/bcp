import { defineThemedStyles } from "../../lib/theme/themedStyles";

import { baseStyles } from "./styles.base";
import { detailPageScale, detailStyles } from "./styles.detail";
import { listStyles } from "./styles.list";
import { overlayStyles } from "./styles.overlays";

export { detailPageScale };

// styles shared across the Psalms, Collects, and Offices reference pages.
// a themed definition (var(--token) strings); consumers resolve it with
// useThemedStyles so it paints from the theme on web and native alike
export const sharedStyles = defineThemedStyles({
  ...baseStyles,
  ...listStyles,
  ...detailStyles,
  ...overlayStyles,
});
