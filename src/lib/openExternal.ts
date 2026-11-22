import { Linking, Platform } from "react-native";
import { IS_TAURI } from "./desktop";

// the webview swallows new windows, so the shell hands urls to the system browser
export function openExternal(url: string) {
  if (IS_TAURI) {
    void import("@tauri-apps/plugin-opener")
      .then(({ openUrl }) => openUrl(url))
      .catch(() => window.open(url, "_blank", "noreferrer"));
    return;
  }
  if (Platform.OS !== "web") {
    void Linking.openURL(url);
    return;
  }
  window.open(url, "_blank", "noreferrer");
}
