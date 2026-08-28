import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CHROME_FONT } from "../../lib/fonts";
import { SearchIcon } from "./Icon";

type SearchFieldProps = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  // true shows the "/" shortcut hint in the placeholder and an Esc-clear
  // button; false (search-only fields) omits both
  shortcut?: boolean;
  onClear?: () => void;
};

// the exact search field the sidebar's global search uses: a bordered,
// rounded inset field with a magnifying-glass icon at 13px type. shared with
// the reference pages' search inputs so every field is identical.
export const SearchField = forwardRef<TextInput, SearchFieldProps>(
  function SearchField(
    { value, onChangeText, placeholder, accessibilityLabel, shortcut, onClear },
    ref,
  ) {
    const showClear = Boolean(shortcut) && value.length > 0;
    return (
      <View style={styles.field}>
        <SearchIcon size={13} color="var(--text-secondary, #7a6e64)" />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={shortcut ? `${placeholder} /` : placeholder}
          placeholderTextColor="var(--text-secondary, #7a6e64)"
          style={styles.input}
          accessibilityLabel={accessibilityLabel}
        />
        {showClear ? (
          <Pressable
            onPress={onClear}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Text style={styles.clear}>Esc</Text>
          </Pressable>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "var(--input-bg, #ece7dd)",
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 3,
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text, #2c2020)",
  },
  clear: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    paddingHorizontal: 4,
  },
});
