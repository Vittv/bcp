import { Platform, View } from "react-native";
import { useScriptureLoading } from "../../lib/content/scriptureLoading";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

const IS_WEB = Platform.OS === "web";

export function ScriptureLoadingBar() {
  const styles = useThemedStyles(barStyles);
  const loading = useScriptureLoading();

  if (!IS_WEB || !loading) return null;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      aria-label="Loading scripture"
    >
      <div className="bcp-scripture-loading-bar" style={trackStyle}>
        <div style={indicatorStyle} />
      </div>
      <style>{`
        @keyframes bcp-scripture-loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .bcp-scripture-loading-bar > div {
          animation: bcp-scripture-loading 1.1s ease-in-out infinite;
        }
      `}</style>
    </View>
  );
}

const trackStyle: React.CSSProperties = {
  position: "relative",
  height: 2,
  width: "100%",
  overflow: "hidden",
  background: "transparent",
};

const indicatorStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: "30%",
  background: "var(--accent)",
  opacity: 0.85,
};

const barStyles = defineThemedStyles({
  wrap: {
    flexShrink: 0,
    height: 2,
  },
});
