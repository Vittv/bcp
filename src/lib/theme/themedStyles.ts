import { useCallback, useMemo } from "react";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { resolveString, resolveTokens } from "./resolve";
import { tokenVars } from "./tokens";

export type { TokenLookup } from "./resolve";
export { resolveString, resolveTokens } from "./resolve";

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function defineThemedStyles<T extends NamedStyles<T>>(styles: T): T {
  return styles;
}

export function useThemedStyles<T extends NamedStyles<T>>(styles: T): T {
  const { tokens, fontVars } = useTheme();
  return useMemo(() => {
    // fonts first, then the color vocabulary: the two never collide, and the
    // font stack is resolved in js so the chrome face follows fontMode on
    // native too, not just through the web css custom property
    const vars = { ...fontVars, ...tokenVars(tokens) };
    // SAFETY: shape preserved by resolveTokens
    return StyleSheet.create(resolveTokens(styles, vars) as T);
  }, [styles, tokens, fontVars]);
}

// resolve a single var(--token, fallback) string against the current theme.
// for props that take a color value directly (icon colors, placeholder-
// TextColor) rather than through a stylesheet, so they stay theme-driven on
// web and native alike.
export function useThemeVar(): (value: string) => string {
  const { tokens, fontVars } = useTheme();
  const vars = useMemo(
    () => ({ ...fontVars, ...tokenVars(tokens) }),
    [tokens, fontVars],
  );
  return useCallback((value: string) => resolveString(value, vars), [vars]);
}
