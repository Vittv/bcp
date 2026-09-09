import {
  type CSSProperties,
  type ReactNode,
  useEffect,
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
}: {
  placeholder: string;
  searchLabel: string;
  onClose: () => void;
  render: (query: string, setQuery: (q: string) => void) => ReactNode;
  searchable?: boolean;
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
    <View style={styles.paletteOverlay}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close search"
      />
      <View style={styles.paletteTray}>
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
            style={PALETTE_LIST_STYLE}
            data-palette-list
            className="bcp-palette-list"
          >
            {render(query, setQuery)}
          </div>
        ) : (
          <View style={styles.paletteBody} dataSet={{ paletteList: "" }}>
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
