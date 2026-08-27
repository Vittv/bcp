import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Shell } from "./src/components/shell/Shell";
import { ThemeProvider } from "./src/context/ThemeContext";

// PWA plumbing for the GitHub Pages deployment: link the manifest and
// register the service worker with paths relative to the page, so the
// same bundle works under any base URL. Native and the desktop shell
// (custom protocol, no SW support) skip this entirely.
function usePwa() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (!window.location.protocol.startsWith("http")) return;
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "manifest.webmanifest";
    document.head.appendChild(manifest);
    navigator.serviceWorker?.register("sw.js").catch(() => {
      // dev servers have no sw.js; offline support is a deploy concern
    });
  }, []);
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "Crimson Pro": require("./assets/fonts/crimson-pro-latin-400-normal.woff2"),
    "Crimson Pro SemiBold": require("./assets/fonts/crimson-pro-latin-600-normal.woff2"),
    "Crimson Pro Italic": require("./assets/fonts/crimson-pro-latin-400-italic.woff2"),
    "JetBrains Mono": require("./assets/fonts/jetbrains-mono-latin-400-normal.woff2"),
  });

  usePwa();

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
