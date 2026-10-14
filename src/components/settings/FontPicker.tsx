import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";
import { type FaceDef, faceStack } from "../../lib/typography/faces";
import { type FaceSource, faceSource } from "../../lib/typography/systemFonts";
import { registerEsc } from "../shell/AppModal";
import { Chevron } from "../shell/Chevron";

const SOURCE_ORDER: FaceSource[] = ["built-in", "system"];
const SOURCE_LABEL: Record<FaceSource, string> = {
  "built-in": "App",
  system: "System",
};

// a dropdown that floats: the trigger names the current face, and the open
// panel is a searchable list of every face the role offers, grouped by where
// it came from. it uses the bar dropdown's machinery (a relative wrapper, an
// absolutely positioned menu pinned under the trigger, and a full-plane
// backdrop that dismisses on an outside click), so opening it overlays the
// pane instead of reflowing it. the specimen lives in the pane below the
// pickers, not here, so this stays a picker.
export function FontPicker({
  label,
  value,
  options,
  onChange,
  onOpen,
  note,
}: {
  label: string;
  value: string;
  options: FaceDef[];
  onChange: (id: string) => void;
  // fired the first time the panel opens, for sources that load on demand
  onOpen?: () => void;
  // a muted line under the list, e.g. why no system faces are listed
  note?: string;
}) {
  const styles = useThemedStyles(fontPickerStyles);
  const v = useThemeVar();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);
  const openedOnce = useRef(false);

  const current = options.find((option) => option.id === value);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? options.filter((option) => option.label.toLowerCase().includes(needle))
      : options;
    return SOURCE_ORDER.map((source) => ({
      source,
      faces: matched.filter((face) => faceSource(face) === source),
    })).filter((group) => group.faces.length > 0);
  }, [options, query]);

  // navigation runs over the flat visible order, matching what the eye reads
  const flat = useMemo(() => groups.flatMap((group) => group.faces), [groups]);

  useEffect(() => {
    if (!open) return;
    return registerEsc(() => setOpen(false));
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (!openedOnce.current) {
      openedOnce.current = true;
      onOpen?.();
    }
    setOpen(true);
  };

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
    <View style={[styles.wrap, open && styles.wrapOpen]}>
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
          <Chevron direction={open ? "up" : "down"} size={7} />
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
          {/* full-plane dismiss layer, dropped behind the menu so a click
              anywhere else closes the picker without reaching the pane */}
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close font menu"
          />
          <View style={styles.panel}>
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
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
              style={styles.search}
              accessibilityLabel={`Search ${label} fonts`}
            />
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {groups.map((group) => (
                <View key={group.source}>
                  <Text style={styles.groupLabel}>
                    {SOURCE_LABEL[group.source]}
                  </Text>
                  <View style={styles.groupRule} />
                  {group.faces.map((face) => {
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
                          style={[
                            styles.rowText,
                            { fontFamily: faceStack(face) },
                          ]}
                          numberOfLines={1}
                        >
                          {face.label}
                        </Text>
                        {selected ? (
                          <Text style={styles.rowCheck}>✓</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              {flat.length === 0 ? (
                <Text style={styles.note}>No matching fonts.</Text>
              ) : null}
              {note ? <Text style={styles.note}>{note}</Text> : null}
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
  search: {
    fontFamily: CHROME_FONT,
    fontSize: 14,
    color: "var(--text)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  list: {
    maxHeight: 300,
  },
  groupLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "var(--text-secondary)",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  // a hairline under each group name, so a heading reads as a heading and not as
  // the first row of its own list
  groupRule: {
    height: 1,
    backgroundColor: "var(--border)",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  rowHover: {
    backgroundColor: "var(--control-hover)",
  },
  rowSelected: {
    backgroundColor: "var(--control-hover)",
  },
  rowText: {
    fontSize: 15,
    color: "var(--text)",
    flexShrink: 1,
  },
  rowCheck: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--accent)",
  },
  note: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
