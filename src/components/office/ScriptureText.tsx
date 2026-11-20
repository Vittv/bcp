import { Text, View } from "react-native";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { type ScriptureSize, scriptureStyles } from "./ScriptureView";

// a curated scripture excerpt that carries no verse numbers; it shares the
// verse voice and citation style with the passage renderer
export function ScriptureText({
  text,
  citation,
  size = "reading",
}: {
  text: string;
  citation?: string;
  size?: ScriptureSize;
}) {
  const styles = useThemedStyles(scriptureStyles);
  return (
    <View style={styles.block}>
      <Text style={[styles.verse, size === "body" && styles.verseBody]}>
        {text}
        {citation ? <Text style={styles.citation}> {citation}</Text> : null}
      </Text>
    </View>
  );
}
