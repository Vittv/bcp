import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { useThemedStyles } from "../../lib/theme/themedStyles";
import { dropdownAnchorStyles } from "./styles";

// react-native-web gives every View z-index 0, so a popover cannot paint over
// a later sibling on its own. every wrapper in between lifts itself while
// open, and the chain runs from the control up to the section.
export const MenuAnchorContext = createContext<(open: boolean) => void>(
  () => undefined,
);

export function MenuAnchor({
  children,
  style,
  nativeID,
  raised: controlledRaised,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  nativeID?: string;
  /** force the raised layer (used by Dropdown, which owns its open state) */
  raised?: boolean;
}) {
  const styles = useThemedStyles(dropdownAnchorStyles);
  const notifyParent = useContext(MenuAnchorContext);
  const [open, setOpen] = useState(false);
  const notify = useCallback(
    (next: boolean) => {
      setOpen(next);
      notifyParent(next);
    },
    [notifyParent],
  );
  const raised = controlledRaised ?? open;
  return (
    <MenuAnchorContext.Provider value={notify}>
      <View nativeID={nativeID} style={[style, raised && styles.raised]}>
        {children}
      </View>
    </MenuAnchorContext.Provider>
  );
}
