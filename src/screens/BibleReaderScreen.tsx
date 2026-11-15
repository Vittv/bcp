import { View } from "react-native";

import { useBible } from "../context/BibleContext";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { BibleChapterBody } from "./BibleReaderScreen.body";
import { DetailPage, EmptyMessage, SplitPane } from "./reference/shared";
import { sharedStyles as styleDef } from "./reference/styles";

export { BibleBar } from "./BibleReaderScreen.bar";
export { BibleBookList, BibleChapterList } from "./BibleReaderScreen.lists";

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function BibleReaderScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { book } = useBible();
  const styles = useThemedStyles(styleDef);
  const hint = (
    <EmptyMessage message="Open the book picker to start reading." />
  );

  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>{book ? <BibleChapterBody /> : hint}</DetailPage>
      </View>
    );
  }

  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={book ? <BibleChapterBody /> : hint}
      detailOpen={book !== null}
    />
  );
}
