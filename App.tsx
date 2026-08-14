import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";
import { TodayScreen } from "./src/screens/TodayScreen";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#faf8f2" }}>
      <TodayScreen />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
