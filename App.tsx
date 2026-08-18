import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Shell } from "./src/components/shell/Shell";
import { ThemeProvider } from "./src/context/ThemeContext";

export default function App() {
  const [fontsLoaded] = useFonts({
    "Crimson Text": require("./assets/fonts/crimson-text-regular.woff2"),
    "Crimson Text Italic": require("./assets/fonts/crimson-text-italic.woff2"),
    "Crimson Text SemiBold": require("./assets/fonts/crimson-text-semibold.woff2"),
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
