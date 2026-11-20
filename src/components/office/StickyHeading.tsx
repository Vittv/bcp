import type { ReactNode } from "react";
import { View } from "react-native";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { officeViewStyles } from "./OfficeView.styles";

// one sticky-heading wrapper for every edition, so section rules behave the
// same wherever they are rendered
export function StickyHeading({
  sticky = false,
  withControl = false,
  children,
}: {
  sticky?: boolean;
  withControl?: boolean;
  children: ReactNode;
}) {
  const styles = useThemedStyles(officeViewStyles);
  return (
    <View
      style={
        sticky
          ? withControl
            ? styles.stickyHeaderControl
            : styles.stickyHeader
          : undefined
      }
    >
      {children}
    </View>
  );
}
