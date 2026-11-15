import { type ReactNode, useCallback, useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  type TextStyle,
  View,
} from "react-native";

import { ListIcon } from "../../../components/shell/Icon";
import { useThemedStyles, useThemeVar } from "../../../lib/theme/themedStyles";
import { useShowHotkeyCap } from "../../../lib/viewport";
import { detailPageScale, sharedStyles } from "../styles";

export const IS_WEB = Platform.OS === "web";

// the PWA is the only mobile distribution; primary-pointer coercion marks
// phones and tablets, which drive every coarse-pointer placement decision
// in the app chrome
export const COARSE_POINTER =
  IS_WEB &&
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

// platform-aware hotkey caps: macs read ⌘, everything else Ctrl. caps are
// desktop-only affordances, so they drop wherever the pointer is coarse
export const HOTKEY_MOD =
  IS_WEB && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

// split-layout pane styles: plain web CSS, since the panes are raw
// focusable scrollers rather than RN views
const SPLIT_STYLE: React.CSSProperties = {
  display: "flex",
  flex: 1,
  height: "100%",
  minHeight: 0,
};

const LIST_PANE_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: "0 0 320px",
  width: 320,
  height: "100%",
  borderLeft: "1px solid var(--border-faint)",
  minHeight: 0,
};

const SPLIT_HEADER_STYLE: React.CSSProperties = {
  padding: "10px 10px 6px",
  flexShrink: 0,
};

const SPLIT_LIST_SCROLL_STYLE: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  minHeight: 0,
};

const DETAIL_PANE_STYLE: React.CSSProperties = {
  flex: 1,
  height: "100%",
  overflowY: "auto",
  minWidth: 0,
  minHeight: 0,
  outline: "none",
};

// desktop: a reading pane beside a persistent index; with no list the
// pane fills the full column (the picker lives in a floating modal now).
// the panes scroll independently and take keyboard focus as the
// selection moves
export function SplitPane({
  list,
  detail,
  detailOpen,
  header,
  fontScale = 1,
  onScrollProgress,
}: {
  list?: ReactNode;
  detail: ReactNode;
  detailOpen: boolean;
  header?: ReactNode;
  fontScale?: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!IS_WEB) return;
    listRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!IS_WEB) return;
    (detailOpen ? detailRef.current : listRef.current)?.focus({
      preventScroll: true,
    });
  }, [detailOpen]);

  const handleDetailScroll = useCallback(() => {
    if (!onScrollProgress) return;
    const el = detailRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    onScrollProgress(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
  }, [onScrollProgress]);

  const styles = useThemedStyles(sharedStyles);

  // biome-ignore-start lint/a11y/noNoninteractiveTabindex: each pane is a
  // scrollable region and must be focusable for native arrow scrolling
  return (
    <div style={SPLIT_STYLE}>
      <div
        ref={detailRef}
        tabIndex={0}
        style={{
          ...DETAIL_PANE_STYLE,
          zoom: fontScale !== 1 ? String(fontScale) : undefined,
        }}
        data-split-detail
        onScroll={handleDetailScroll}
      >
        <View
          style={[
            styles.detailPage,
            detailPageScale(fontScale, { preserveMeasure: true }),
          ]}
        >
          {detail}
        </View>
      </div>
      {list ? (
        <div ref={listRef} tabIndex={0} style={LIST_PANE_STYLE} data-split-list>
          {header ? <div style={SPLIT_HEADER_STYLE}>{header}</div> : null}
          <div style={SPLIT_LIST_SCROLL_STYLE} data-split-list-scroll>
            {list}
          </div>
        </div>
      ) : null}
    </div>
  );
  // biome-ignore-end lint/a11y/noNoninteractiveTabindex: see above
}

// mobile detail wrapper: the pane scrolls the document column.
// compact switches to the phone-width inset so opened psalms,
// collects and offices breathe like Today does on small screens
export function DetailPage({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const styles = useThemedStyles(sharedStyles);
  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={{ alignItems: "center" }}
    >
      <View style={[styles.detailPage, compact && styles.detailPageMobile]}>
        {children}
      </View>
    </ScrollView>
  );
}

export function EmptyMessage({ message }: { message: string }) {
  const styles = useThemedStyles(sharedStyles);
  return <Text style={styles.empty}>{message}</Text>;
}

// the one highlight state of every picker row, shared by keyboard and mouse
// the same way cmdk does: the active row draws accent text plus the red ▸ in
// the indented gutter, never a background fill. the keyboard (j/k via
// ctrl+j/ctrl+k, arrows) moves it and scrolls it into view; the pointer
// drags the very same cursor without scrolling. any picker, any input, the
// highlight looks identical. the picked value is deliberately NOT
// highlighted so only what is in play right now lights up.
export function IndexRow({
  onPress,
  children,
  cursor = false,
}: {
  onPress: () => void;
  children: (active: boolean) => ReactNode;
  cursor?: boolean;
}) {
  const styles = useThemedStyles(sharedStyles);
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      {cursor && <Text style={styles.pickerCursor}>▸</Text>}
      {children(cursor)}
    </Pressable>
  );
}

// the platform-aware hotkey chip ("Ctrl /" or "⌘ K") that advertises the
// shortcut behind a picker button, rendered on every build
export function KeyCap({
  label,
  style,
}: {
  label: string;
  style?: StyleProp<TextStyle>;
}) {
  const styles = useThemedStyles(sharedStyles);
  return <Text style={[styles.pickerKbd, style]}>{label}</Text>;
}

// the bar's current-pick chip: shows what the page is displaying and
// opens the floating picker for the page. a bordered, clickable
// rectangle that reads in normal ink. an optional meta string is
// right-aligned in the strip: the position/verse counts that make the
// full-bar chip read as a live caption instead of empty space, plus a
// key-cap pinned to the far right advertising the "/" chord that opens
// the same picker
export function PickerButton({
  label,
  meta,
  onPress,
}: {
  label: string;
  meta?: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(sharedStyles);
  const v = useThemeVar();
  // the "/" cap only earns its space with a fine pointer and a wide enough bar
  const showHotkeyCap = useShowHotkeyCap();
  return (
    <Pressable
      style={({ hovered }) => [
        styles.pickerBtn,
        hovered && styles.pickerBtnHover,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Change ${label}`}
    >
      <ListIcon size={13} color={v("var(--text-secondary)")} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.pickerText}>
        {label}
      </Text>
      {meta ? (
        <Text numberOfLines={1} ellipsizeMode="head" style={styles.pickerMeta}>
          {meta}
        </Text>
      ) : null}
      {showHotkeyCap ? (
        <KeyCap
          label="/"
          style={meta ? { marginLeft: 8 } : { marginLeft: "auto" }}
        />
      ) : null}
    </Pressable>
  );
}
