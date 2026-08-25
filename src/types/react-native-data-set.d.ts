// dataSet renders as data-* attributes in react-native-web; used for
// tauri's data-tauri-drag-region titlebar handling. Runtime support
// exists in RNW's forwardedProps, but react-native's shipped types
// omit the member, so declare it here.
import "react-native";

declare module "react-native" {
  interface ViewProps {
    dataSet?: Record<string, string | number | boolean> | undefined;
  }
  interface TextProps {
    dataSet?: Record<string, string | number | boolean> | undefined;
  }
}
