// Dynamic Expo config: the asset base URL needs to differ between the two
// deployment targets. GitHub Pages serves the PWA under /bcp, while the Tauri
// desktop shell embeds the same export at the webview's protocol root, where a
// /bcp prefix points at nothing and blanks the window. BASE_URL overrides the
// default /bcp per invocation; the desktop scripts set it to the webview root.
const baseUrl = process.env.BASE_URL || "/bcp";

module.exports = {
  expo: {
    name: "bcp",
    slug: "bcp",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    experiments: {
      baseUrl,
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
  },
};
