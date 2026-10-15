import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";
import { type FaceDef, faceStack } from "../../lib/typography/faces";
import { registerEsc } from "../shell/AppModal";
import { Chevron } from "../shell/Chevron";
import { CheckIcon, CloseIcon, MagnifierIcon } from "../shell/Icon";

const IS_WEB = Platform.OS === "web";

// a dropdown that floats: the trigger names the current face, and the open
// panel is a searchable list of every face the role offers. it uses the bar
// dropdown's machinery (a relative wrapper and an absolutely positioned menu
// pinned under the trigger), so opening it overlays the pane instead of
// reflowing it. an outside click dismisses it: on web a document listener, on
// native a full-plane backdrop, because an oversized absolute backdrop inside
// the settings pane's scroller would stretch that scroller's content into a
// large empty scroll range. the specimen lives in the pane below the pickers,
// not here, so this stays a picker.
export function FontPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FaceDef[];
  onChange: (id: string) => void;
}) {
  const styles = useThemedStyles(fontPickerStyles);
  const v = useThemeVar();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);

  const current = options.find((option) => option.id === value);

  // rendering and navigation share this order, matching what the eye reads
  const flat = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? options.filter((option) => option.label.toLowerCase().includes(needle))
      : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    return registerEsc(() => setOpen(false));
  }, [open]);

  // web dismissal is a document listener so no oversized element sits in the
  // pane's scroller (see the header note); the listener is capture-phase so a
  // handler below cannot swallow the click before it closes the panel
  useEffect(() => {
    if (!IS_WEB || !open) return;
    const onPointerDown = (e: PointerEvent) => {
      // SAFETY: pointerdown targets are DOM nodes; anything without closest()
      // (the document, a text node) reads as outside and closes the panel
      const target = e.target as Element | null;
      if (target?.closest("[data-picker]")) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const toggle = () => setOpen((was) => !was);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
    setHighlight(null);
  };

  const move = (delta: number) => {
    if (flat.length === 0) return;
    const at = flat.findIndex((face) => face.id === highlight);
    const next = at < 0 ? (delta > 0 ? 0 : flat.length - 1) : at + delta;
    const clamped = Math.max(0, Math.min(flat.length - 1, next));
    setHighlight(flat[clamped]?.id ?? null);
  };

  return (
    <View
      dataSet={{ picker: "" }}
      style={[styles.wrap, open && styles.wrapOpen]}
    >
      <Pressable
        onPress={toggle}
        style={({ hovered }) => [
          styles.trigger,
          hovered && styles.triggerHover,
          open && styles.triggerOpen,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${label}: ${current?.label ?? "default"}`}
      >
        <View style={styles.triggerValue}>
          <Chevron direction={open ? "up" : "down"} size={6} />
          <Text
            style={[
              styles.triggerValueText,
              // the current face, previewed on its own trigger
              current ? { fontFamily: faceStack(current) } : null,
            ]}
            numberOfLines={1}
          >
            {current?.label ?? "Default"}
          </Text>
        </View>
        <Text style={styles.triggerLabel}>{label}</Text>
      </Pressable>

      {open ? (
        <>
          {/* native dismiss layer; web uses the document listener above, since
              this oversized absolute box would otherwise stretch the pane's
              scroller and hand it a large empty scroll range */}
          {IS_WEB ? null : (
            <Pressable
              style={styles.backdrop}
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close font menu"
            />
          )}
          <View style={styles.panel}>
            <View style={styles.searchField}>
              <MagnifierIcon size={15} color={v("var(--text-secondary)")} />
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                dataSet={{ pickerSearch: "" }}
                onKeyPress={(event) => {
                  const key = event.nativeEvent.key;
                  if (key === "ArrowDown") move(1);
                  else if (key === "ArrowUp") move(-1);
                  else if (key === "Enter") {
                    // with nothing highlighted yet, Enter takes the first match
                    const id = highlight ?? flat[0]?.id;
                    if (id) pick(id);
                  }
                }}
                placeholder="Search fonts"
                placeholderTextColor={v("var(--text-secondary)")}
                style={styles.searchInput}
                accessibilityLabel={`Search ${label} fonts`}
              />
              {query ? (
                <Pressable
                  onPress={() => setQuery("")}
                  accessibilityRole="button"
                  accessibilityLabel="Clear font search"
                  style={({ hovered }) => [
                    styles.searchClear,
                    hovered && styles.searchClearHover,
                  ]}
                >
                  <CloseIcon size={12} color={v("var(--text-secondary)")} />
                </Pressable>
              ) : null}
            </View>
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {flat.map((face) => {
                const selected = face.id === value;
                return (
                  <Pressable
                    key={face.id}
                    onHoverIn={() => setHighlight(face.id)}
                    onPress={() => pick(face.id)}
                    style={({ hovered }) => [
                      styles.row,
                      (hovered || face.id === highlight) && styles.rowHover,
                      selected && styles.rowSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[styles.rowText, { fontFamily: faceStack(face) }]}
                      numberOfLines={1}
                    >
                      {face.label}
                    </Text>
                    {selected ? (
                      <CheckIcon size={14} color={v("var(--accent)")} />
                    ) : null}
                  </Pressable>
                );
              })}
              {flat.length === 0 ? (
                <Text style={styles.note}>No matching fonts.</Text>
              ) : null}
            </ScrollView>
          </View>
        </>
      ) : null}
    </View>
  );
}

const fontPickerStyles = defineThemedStyles({
  // anchor for the menu; the wrapper stays at zIndex auto so the menu's own
  // zIndex floats it over later siblings regardless of DOM order
  wrap: {
    position: "relative",
    marginBottom: 16,
  },
  // while open the wrapper becomes a stacking context, lifting the whole
  // picker above the sections that follow it in the pane (inline elements
  // otherwise win by DOM order); only the open one is lifted, so two pickers
  // never fight over the same layer
  wrapOpen: {
    zIndex: 3,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border)",
  },
  triggerHover: {
    backgroundColor: "var(--control-hover)",
  },
  triggerOpen: {
    borderColor: "var(--accent)",
  },
  triggerLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  triggerValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  // the leading element: the current face, previewed in its own typeface.
  // it is tinted secondary rather than --text so the section's 600-weight
  // heading still leads; the chevron and the role label share the tint
  triggerValueText: {
    fontFamily: CHROME_FONT,
    fontSize: 15,
    fontWeight: "500",
    color: "var(--text-secondary)",
    flexShrink: 1,
  },
  // full-plane dismiss layer; the huge offsets escape the trigger's box
  backdrop: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 30000,
    height: 30000,
    zIndex: 40,
  },
  // the floating menu: pinned under the trigger, spanning its width, painting
  // over the settings below instead of shoving them down. the app surface, so
  // it matches the rest of the shell (the lift comes from the picker section's
  // z-index, not a brighter fill)
  panel: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 6,
    zIndex: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "var(--border-content)",
    backgroundColor: "var(--bg)",
    overflow: "hidden",
    shadowColor: "var(--shadow-color)",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  // the field mirrors the rail's search: a magnifier, the input, and a clear
  // button when there is a query. inside the panel it goes borderless, seated
  // by a rule under it rather than a pill around it
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text)",
    padding: 0,
    userSelect: "text",
  },
  searchClear: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  searchClearHover: {
    backgroundColor: "var(--control-hover)",
  },
  list: {
    maxHeight: 300,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  rowHover: {
    backgroundColor: "var(--control-hover)",
  },
  // the chosen face keeps a fill of its own, so hover and selection differ
  rowSelected: {
    backgroundColor: "var(--selected-bg)",
  },
  rowText: {
    fontSize: 15,
    color: "var(--text)",
    flexShrink: 1,
  },
  note: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    lineHeight: 18,
    color: "var(--text-secondary)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
