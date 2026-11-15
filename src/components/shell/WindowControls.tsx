import type { ResolvedWindowControlStyle } from "../../lib/windowDecorations";

import { useWindowActions } from "./windowControls/actions";
import {
  LinuxControls,
  MacControls,
  WindowsControls,
} from "./windowControls/Controls";

// custom titlebar cluster; the style picks the edge and glyph convention
export function WindowControls({
  style,
}: {
  style: ResolvedWindowControlStyle;
}) {
  const actions = useWindowActions();
  switch (style) {
    case "macos":
      return <MacControls actions={actions} />;
    case "linux":
      return <LinuxControls actions={actions} />;
    case "windows":
      return <WindowsControls actions={actions} />;
    default:
      return null;
  }
}
