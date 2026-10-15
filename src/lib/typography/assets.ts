// the metro module for every bundled face, keyed by the family name the registry
// registers. a literal require() map, since metro bundles only static imports;
// kept apart from faces.ts so the pure registry stays importable under bun test.

export const FACE_ASSETS: Record<string, number> = {
  "Inter Tight": require("../../../assets/fonts/inter-tight-latin-var.woff2"),
  "Crimson Pro": require("../../../assets/fonts/crimson-pro-latin-400-normal.woff2"),
  "Crimson Pro SemiBold": require("../../../assets/fonts/crimson-pro-latin-600-normal.woff2"),
  "Crimson Pro Italic": require("../../../assets/fonts/crimson-pro-latin-400-italic.woff2"),
  "Playfair Display": require("../../../assets/fonts/playfair-display-latin-var.woff2"),
  "JetBrains Mono": require("../../../assets/fonts/jetbrains-mono-500.woff2"),
  Libron: require("../../../assets/fonts/libron-400-normal.woff2"),
  "Libron Italic": require("../../../assets/fonts/libron-400-italic.woff2"),
  "Libron Bold": require("../../../assets/fonts/libron-700-normal.woff2"),
  "EB Garamond": require("../../../assets/fonts/eb-garamond-latin-400-normal.woff2"),
  "EB Garamond SemiBold": require("../../../assets/fonts/eb-garamond-latin-600-normal.woff2"),
  "EB Garamond Italic": require("../../../assets/fonts/eb-garamond-latin-400-italic.woff2"),
};
