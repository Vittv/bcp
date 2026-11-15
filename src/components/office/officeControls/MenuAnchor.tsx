import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { useThemedStyles } from "../../../lib/theme/themedStyles";
import { menuAnchorStyles } from "./styles";

// react-native-web gives every View z-index 0, so a popover cannot paint over
// a later sibling on its own. every wrapper in between lifts itself while open.
export const MenuAnchorContext = createContext<(open: boolean) => void>(
  () => undefined,
);

// an anchor that raises itself while a nested ChoiceMenu is open. nesting
// these from the control up to the section lets the popover clear every later
// sibling.
export function MenuAnchor({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(menuAnchorStyles);
  const notifyParent = useContext(MenuAnchorContext);
  const [open, setOpen] = useState(false);
  const notify = useCallback(
    (next: boolean) => {
      setOpen(next);
      notifyParent(next);
    },
    [notifyParent],
  );
  return (
    <MenuAnchorContext.Provider value={notify}>
      <View style={[style, open && styles.raised]}>{children}</View>
    </MenuAnchorContext.Provider>
  );
}
