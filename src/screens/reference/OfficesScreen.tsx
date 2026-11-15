import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { Segmented } from "../../components/office/OfficeControls";
import { OfficeHeader } from "../../components/office/OfficeHeader";
import { OfficeView } from "../../components/office/OfficeView";
import { useOfficeSettings } from "../../context/OfficeSettingsContext";
import { composeOffice } from "../../lib/office";
import { DEFAULT_PREFS } from "../../lib/office/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import {
  DetailPage,
  type RefOfficeBase,
  refOfficeId,
  useReference,
} from "./shared";
import { detailPageScale, sharedStyles as styleDef } from "./styles";

const IS_WEB = Platform.OS === "web";

export function OfficesScreen({
  onScrollProgress,
  isMobile,
  fontScale = 1,
}: {
  // the page scrolls in its own ScrollView (the shell's outer scroller
  // is hidden on reference pages), so it reports progress up to the
  // status bar itself
  onScrollProgress?: (pct: number) => void;
  isMobile: boolean;
  fontScale?: number;
}) {
  const { openOffice, officeRite } = useReference();
  // the bar picks the office; the page just renders it full-width.
  // height 100% is what bounds the ScrollView: the shell wrapper above
  // is a plain block, so flex alone leaves it unbounded and unscrollable
  const current = openOffice ?? "morning";

  // document switches reset scroll position; report that too, since a
  // programmatic reset emits no scroll event (latest-ref keeps the
  // callback out of the dependency list)
  const progressRef = useRef(onScrollProgress);
  useEffect(() => {
    progressRef.current = onScrollProgress;
  });
  // fires on document *identity* change (scroll reset), not value reads
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    progressRef.current?.(0);
  }, [current, officeRite]);

  const styles = useThemedStyles(styleDef);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.height - layoutMeasurement.height;
    onScrollProgress?.(max > 0 ? Math.round((contentOffset.y / max) * 100) : 0);
  };

  if (isMobile) {
    return (
      <View style={[styles.container, { height: "100%" }]}>
        <DetailPage compact>
          <OfficeDetailBody base={current} />
        </DetailPage>
      </View>
    );
  }

  if (IS_WEB) {
    return (
      <View style={[styles.container, { height: "100%" }]}>
        <div
          key={current}
          style={{
            boxSizing: "border-box",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            zoom: fontScale !== 1 ? String(fontScale) : undefined,
          }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const max = el.scrollHeight - el.clientHeight;
            onScrollProgress?.(
              max > 0 ? Math.round((el.scrollTop / max) * 100) : 0,
            );
          }}
        >
          <View
            style={[
              styles.detailPage,
              detailPageScale(fontScale, { preserveMeasure: true }),
            ]}
          >
            <OfficeDetailBody base={current} />
          </View>
        </div>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: "100%" }]}>
      {/* key resets scroll when switching offices */}
      <ScrollView
        key={current}
        style={styles.list}
        contentContainerStyle={{ alignItems: "center" }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.detailPage, detailPageScale(fontScale)]}>
          <OfficeDetailBody base={current} />
        </View>
      </ScrollView>
    </View>
  );
}

export { OfficesBar } from "./OfficesScreen.bar";

// memoized so bar interactions (e.g. the date picker popover) don't
// recompose the whole office text
const OfficeDetailBody = memo(function OfficeDetailBody({
  base,
}: {
  base: RefOfficeBase;
}) {
  const { officeDate, officeRite } = useReference();
  const { showRubrics, showSpeakers, customizationFor } = useOfficeSettings();
  const [fullText, setFullText] = useState(false);
  const officeId = refOfficeId(base, officeRite);
  const customization = customizationFor(officeId);
  const document = useMemo(
    () =>
      composeOffice(officeDate, officeId, {
        ...DEFAULT_PREFS,
        rite: officeRite,
        personalMode: false,
        showRubrics,
        fullText,
        customization,
      }),
    [officeDate, officeId, officeRite, showRubrics, fullText, customization],
  );
  return (
    <>
      {/* the reference page can print the office as the book does, with the
          whole opening menu and the canticle table rather than one pick */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginBottom: 4,
        }}
      >
        <Segmented
          value={fullText ? "full" : "reading"}
          options={[
            { id: "reading", label: "Reading" },
            { id: "full", label: "Full text" },
          ]}
          accessibilityLabel="Office text mode"
          onChange={(id) => setFullText(id === "full")}
        />
      </View>
      {/* same masthead as Today: name, date, feast line */}
      <OfficeHeader document={document} />
      <OfficeView
        document={document}
        showRubrics={showRubrics}
        showSpeakers={showSpeakers}
        fullText={fullText}
      />
    </>
  );
});
