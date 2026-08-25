import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Shell } from "./src/components/shell/Shell";
import { ThemeProvider } from "./src/context/ThemeContext";

export default function App() {
  const [fontsLoaded] = useFonts({
    "Crimson Pro": require("./assets/fonts/crimson-pro-latin-400-normal.woff2"),
    "Crimson Pro SemiBold": require("./assets/fonts/crimson-pro-latin-600-normal.woff2"),
    "Crimson Pro Italic": require("./assets/fonts/crimson-pro-latin-400-italic.woff2"),
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
