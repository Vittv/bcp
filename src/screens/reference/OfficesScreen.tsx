import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Bcp1662OfficeView } from "../../components/office/Bcp1662OfficeView";
import { Bcp1962LitanyView } from "../../components/office/Bcp1962LitanyView";
import { Bcp1962OfficeView } from "../../components/office/Bcp1962OfficeView";
import { Segmented } from "../../components/office/OfficeControls";
import { OfficeHeader } from "../../components/office/OfficeHeader";
import { OfficeView } from "../../components/office/OfficeView";
import { useEdition } from "../../context/EditionContext";
import { useOfficeSettings } from "../../context/OfficeSettingsContext";
import {
  type Bcp1662ComposedOffice,
  composeBcp1662Litany,
  composeBcp1662OfficeForDate,
} from "../../lib/content/bcp1662";
import {
  type Bcp1962ComposedOffice,
  composeBcp1962Compline,
  composeBcp1962Litany,
  composeBcp1962Noonday,
  composeBcp1962OfficeForDate,
} from "../../lib/content/bcp1962";
import type { OfficeId } from "../../lib/content/types";
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
  const { edition } = useEdition();
  const { officeDate, officeRite } = useReference();
  const { showRubrics, showSpeakers, customizationFor } = useOfficeSettings();
  const [fullText, setFullText] = useState(false);
  // the Litany is 1662-only; compose a safe 1979 id so the always-run compose
  // below cannot throw, while the 1662 render path uses the litany doc instead
  // SAFETY: base is narrowed to a non-litany id, so refOfficeId returns a real
  // 1979 OfficeId; litany is mapped to morning before the call
  const officeId = refOfficeId(
    base === "litany" ? "morning" : base,
    officeRite,
  ) as OfficeId;
  const customization = customizationFor(officeId);
  const document = useMemo(() => {
    if (edition === "1662" || edition === "1962") return null;
    return composeOffice(officeDate, officeId, {
      ...DEFAULT_PREFS,
      rite: officeRite,
      personalMode: false,
      showRubrics,
      fullText,
      customization,
    });
  }, [
    edition,
    officeDate,
    officeId,
    officeRite,
    showRubrics,
    fullText,
    customization,
  ]);

  const [bcp1662Doc, setBcp1662Doc] = useState<Bcp1662ComposedOffice | null>(
    null,
  );
  const [bcp1662Loading, setBcp1662Loading] = useState(false);
  const [bcp1662Error, setBcp1662Error] = useState<string | null>(null);

  useEffect(() => {
    if (edition !== "1662") return;
    if (base === "litany") {
      setBcp1662Doc(composeBcp1662Litany(officeDate));
      setBcp1662Error(null);
      setBcp1662Loading(false);
      return;
    }
    if (base !== "morning" && base !== "evening") {
      setBcp1662Doc(null);
      setBcp1662Error(null);
      setBcp1662Loading(false);
      return;
    }
    let cancelled = false;
    setBcp1662Loading(true);
    setBcp1662Error(null);
    void composeBcp1662OfficeForDate(officeDate, base)
      .then((doc) => {
        if (!cancelled) setBcp1662Doc(doc);
      })
      .catch((e) => {
        if (!cancelled) {
          setBcp1662Doc(null);
          setBcp1662Error(
            e instanceof Error ? e.message : "Failed to compose 1662 office",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setBcp1662Loading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [edition, base, officeDate]);

  const [bcp1962Doc, setBcp1962Doc] = useState<Bcp1962ComposedOffice | null>(
    null,
  );
  const [bcp1962Loading, setBcp1962Loading] = useState(false);
  const [bcp1962Error, setBcp1962Error] = useState<string | null>(null);

  useEffect(() => {
    if (edition !== "1962") return;
    if (base !== "morning" && base !== "evening") {
      setBcp1962Doc(null);
      setBcp1962Error(null);
      setBcp1962Loading(false);
      return;
    }
    let cancelled = false;
    setBcp1962Loading(true);
    setBcp1962Error(null);
    void composeBcp1962OfficeForDate(officeDate, base)
      .then((doc) => {
        if (!cancelled) setBcp1962Doc(doc);
      })
      .catch((e) => {
        if (!cancelled) {
          setBcp1962Doc(null);
          setBcp1962Error(
            e instanceof Error ? e.message : "Failed to compose 1962 office",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setBcp1962Loading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [edition, base, officeDate]);

  if (edition === "1662") {
    if (base !== "morning" && base !== "evening" && base !== "litany") {
      return (
        <Text style={{ opacity: 0.7 }}>
          This office is not yet available in the 1662 Book of Common Prayer.
        </Text>
      );
    }
    if (bcp1662Loading && !bcp1662Doc) {
      return <Text style={{ opacity: 0.7 }}>Composing office…</Text>;
    }
    if (bcp1662Error) {
      return <Text style={{ opacity: 0.7 }}>{bcp1662Error}</Text>;
    }
    if (!bcp1662Doc) return null;
    return (
      <Bcp1662OfficeView
        doc={bcp1662Doc}
        showRubrics={showRubrics}
        showSpeakers={showSpeakers}
      />
    );
  }

  if (edition === "1962") {
    if (base === "litany") {
      return (
        <Bcp1962LitanyView
          doc={composeBcp1962Litany(officeDate)}
          showRubrics={showRubrics}
          showSpeakers={showSpeakers}
        />
      );
    }
    if (base === "noonday" || base === "compline") {
      return (
        <Bcp1962OfficeView
          doc={
            base === "noonday"
              ? composeBcp1962Noonday(officeDate)
              : composeBcp1962Compline(officeDate)
          }
          showRubrics={showRubrics}
          showSpeakers={showSpeakers}
        />
      );
    }
    if (base !== "morning" && base !== "evening") {
      return (
        <Text style={{ opacity: 0.7 }}>
          This office is not yet available in the 1962 Book of Common Prayer.
        </Text>
      );
    }
    if (bcp1962Loading && !bcp1962Doc) {
      return <Text style={{ opacity: 0.7 }}>Composing office…</Text>;
    }
    if (bcp1962Error) {
      return <Text style={{ opacity: 0.7 }}>{bcp1962Error}</Text>;
    }
    if (!bcp1962Doc) return null;
    return (
      <Bcp1962OfficeView
        doc={bcp1962Doc}
        showRubrics={showRubrics}
        showSpeakers={showSpeakers}
      />
    );
  }

  if (!document) return null;
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
