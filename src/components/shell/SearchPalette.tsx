import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { sharedStyles as styles } from "../../screens/reference/styles";
import { registerEsc } from "./AppModal";

// the floating picker every reference page opens instead of the old
// right-hand split-pane index. the frame matches the site's search tray:
// the search field is pinned to the top (it never scrolls), the result
// list scrolls beneath it, and a navigation hint row is pinned to the
// bottom (navigate with the arrows, enter to open, esc to close). there
// is no title bar and no X; the backdrop, Esc, Android back, and picking
// a row all close it. every section filters its own list over the shared
// search field.
export function SearchPalette({
  placeholder,
  searchLabel,
  onClose,
  render,
  searchable = true,
  autoHeight = false,
}: {
  placeholder: string;
  searchLabel: string;
  onClose: () => void;
  render: (query: string, setQuery: (q: string) => void) => ReactNode;
  searchable?: boolean;
  // the global search sizes to its results (a slim card that grows as
  // typing fills it); the scoped pickers keep the fixed 70% frame
  autoHeight?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Esc (web, via the shell's global Escape path) and the Android back
  // button close the picker the same way they close any modal
  useEffect(() => {
    if (Platform.OS !== "web") {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onClose();
        return true;
      });
      return () => sub.remove();
    }
    return registerEsc(onClose);
  }, [onClose]);

  // land the caret straight in the search field so typing filters the
  // list immediately, the same one-motion flow the old picker offered
  useEffect(() => {
    if (searchable) inputRef.current?.focus();
  }, [searchable]);

  // the global palette anchors at the top of the frame the scoped
  // pickers occupy: their 70% tray is centered, so its top edge sits
  // 15% down the viewport; matching that makes the empty card begin in
  // exactly the same place and grow downward from there
  const autoTop = useMemo(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return 40;
    return Math.round(window.innerHeight * 0.15);
  }, []);

  const navHints = (
    <>
      <View style={styles.paletteHint}>
        <Text style={styles.paletteKbd}>↓</Text>
        <Text style={styles.paletteKbd}>↑</Text>
        <Text style={styles.paletteHintText}>navigate</Text>
      </View>
      <View style={styles.paletteHint}>
        <Text style={styles.paletteKbd}>↵</Text>
        <Text style={styles.paletteHintText}>open</Text>
      </View>
      <View style={styles.paletteHint}>
        <Text style={styles.paletteKbd}>esc</Text>
        <Text style={styles.paletteHintText}>close</Text>
      </View>
    </>
  );

  return (
    <View
      style={[
        styles.paletteOverlay,
        autoHeight && styles.paletteOverlayAuto,
      ]}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close search"
      />
      <View
        style={[
          styles.paletteTray,
          autoHeight && styles.paletteTrayAuto,
          autoHeight && { marginTop: autoTop },
        ]}
      >
        {searchable ? (
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            dataSet={{ pickerSearch: "" }}
            placeholder={placeholder}
            placeholderTextColor="var(--text-secondary, #7a6e64)"
            style={styles.paletteSearch}
            accessibilityLabel={searchLabel}
          />
        ) : null}
        {Platform.OS === "web" ? (
          <div
            style={autoHeight ? PALETTE_LIST_AUTO_STYLE : PALETTE_LIST_STYLE}
            data-palette-list
            className="bcp-palette-list"
          >
            {render(query, setQuery)}
          </div>
        ) : (
          <View
            style={[
              styles.paletteBody,
              autoHeight && styles.paletteBodyAuto,
            ]}
            dataSet={{ paletteList: "" }}
          >
            {render(query, setQuery)}
          </View>
        )}
        <View style={styles.paletteFooter}>{navHints}</View>
      </View>
    </View>
  );
}

// the scroller must be a real DOM element with an explicit, bounded height
// so overflow clipping actually engages (mirrors cmdk's Command.List:
// a max-height list that scrolls independently of the page). a percentage
// chain through RN-web Views does not reliably become a scroll container.
const PALETTE_LIST_STYLE: CSSProperties = {
  boxSizing: "border-box",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingTop: 4,
  paddingBottom: 4,
  WebkitOverflowScrolling: "touch",
};

// auto-height mode (global search): the list grows with its content and
// only scrolls once the tray's max-height caps it. grow is disabled so a
// brief empty palette stays a slim card instead of stretching to fill,
// and the frame padding is dropped so the footer sits flush under the
// search field until results reintroduce their own row spacing
const PALETTE_LIST_AUTO_STYLE: CSSProperties = {
  ...PALETTE_LIST_STYLE,
  flex: "0 1 auto",
  paddingTop: 0,
  paddingBottom: 0,
};
