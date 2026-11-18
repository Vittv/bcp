import { Image, Pressable, Text, View } from "react-native";

import {
  getSystemTheme,
  loadThemeFamily,
  loadThemeMode,
} from "../../lib/theme/themePreferences";
import { themeTokens } from "../../lib/theme/themes";
import { errorCoverStyles as makeStyles } from "./errorCoverStyles";

const CROSS_ICON = require("../../../assets/app_icons/cross_light_192.png");

export function ErrorCoverScreen({ onRefresh }: { onRefresh: () => void }) {
  // the fallback renders outside the providers, so resolve the saved palette
  // here instead of reading a context the crash may have taken with it
  const mode = loadThemeMode();
  const tokens = themeTokens(
    loadThemeFamily(),
    mode === "system" ? getSystemTheme() : mode,
  );
  const styles = makeStyles(tokens);
  return (
    <View style={styles.cover}>
      <View style={styles.frame}>
        <Image
          source={CROSS_ICON}
          tintColor={tokens.accent}
          resizeMode="contain"
          style={styles.cross}
          accessibilityLabel="Canterbury cross"
        />
        <Text style={styles.monogram}>BCP</Text>
        <View style={styles.rule} />
        <Text style={styles.title}>{"The Book of\nCommon Prayer"}</Text>
      </View>
      <Text style={styles.message}>The page could not be opened.</Text>
      <Pressable
        onPress={onRefresh}
        accessibilityRole="button"
        accessibilityLabel="Refresh the app"
      >
        <View style={styles.button}>
          <Text style={styles.buttonText}>Refresh</Text>
        </View>
      </Pressable>
    </View>
  );
}
