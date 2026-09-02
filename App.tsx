import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Shell } from "./src/components/shell/Shell";
import { ThemeProvider } from "./src/context/ThemeContext";

// the PWA plumbing for the GitHub Pages deployment (manifest link and service
// worker registration) lives statically in public/index.html, which Expo uses
// as the web HTML template. Keeping it out of the bundle lets browsers read the
// manifest at parse time, which Chrome and Firefox require for installability.

export default function App() {
  const [fontsLoaded] = useFonts({
    "Crimson Pro": require("./assets/fonts/crimson-pro-latin-400-normal.woff2"),
    "Crimson Pro SemiBold": require("./assets/fonts/crimson-pro-latin-600-normal.woff2"),
    "Crimson Pro Italic": require("./assets/fonts/crimson-pro-latin-400-italic.woff2"),
    "Playfair Display": require("./assets/fonts/playfair-display-latin-var.woff2"),
    "JetBrains Mono": require("./assets/fonts/jetbrains-mono-latin-500-normal.woff2"),
  });

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
