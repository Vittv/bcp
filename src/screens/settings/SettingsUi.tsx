import { Pressable, Text, TextInput, View } from "react-native";
import { CloseIcon, MagnifierIcon } from "../../components/shell/Icon";
import { useThemedStyles, useThemeVar } from "../../lib/theme/themedStyles";
import type { ThemeTokens } from "../../lib/theme/tokens";
import { settingsStyles } from "./settingsStyles";

// the mag-glass field filters the rail categories on desktop and the settings
// list on phones as you type; the same token matcher behind it feeds the
// global cmd+K palette
export function SettingsSearch({
  query,
  onChange,
}: {
  query: string;
  onChange: (q: string) => void;
}) {
  const styles = useThemedStyles(settingsStyles);
  const v = useThemeVar();
  return (
    <View style={styles.searchField} dataSet={{ settingsSearch: "" }}>
      <View style={styles.searchIcon}>
        <MagnifierIcon size={14} color={v("var(--text-secondary)")} />
      </View>
      <TextInput
        value={query}
        onChangeText={onChange}
        placeholder="Search"
        placeholderTextColor={v("var(--text-secondary)")}
        accessibilityLabel="Search settings"
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {query ? (
        <Pressable
          onPress={() => onChange("")}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={({ hovered }) => [
            styles.searchClear,
            hovered && styles.searchClearHover,
          ]}
        >
          <CloseIcon size={12} color={v("var(--text-secondary)")} />
        </Pressable>
      ) : null}
    </View>
  );
}

export const ON_OFF = [
  { id: true as const, label: "On" },
  { id: false as const, label: "Off" },
];

// a row of pressable option chips with the active one highlighted; one
// control for every option-style setting
export function OptionChips<T extends string | boolean = string>({
  options,
  value,
  onSelect,
  mono = false,
  wrap = false,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onSelect: (id: T) => void;
  mono?: boolean;
  wrap?: boolean;
}) {
  const styles = useThemedStyles(settingsStyles);
  return (
    <View style={[styles.row, wrap && styles.rowWrap]}>
      {options.map(({ id, label }) => (
        <Text
          key={String(id)}
          style={[
            styles.option,
            mono && styles.optionMono,
            value === id && styles.optionActive,
          ]}
          onPress={() => onSelect(id)}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

// an on/off setting: label, On/Off chips, and a one-line description
export function ToggleRow({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description: string;
}) {
  const styles = useThemedStyles(settingsStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <OptionChips options={ON_OFF} value={value} onSelect={onChange} />
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
  );
}

// a miniature of the app painted with a family's own tokens, so the picker
// shows the palette instead of describing it. it takes the resolved tokens,
// not the family, so switching Mode re-tints every preview to the variant the
// user would actually get.
export function ThemePreview({
  label,
  tokens,
  selected,
  onSelect,
}: {
  label: string;
  tokens: ThemeTokens;
  selected: boolean;
  onSelect: () => void;
}) {
  const styles = useThemedStyles(settingsStyles);
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} theme`}
      style={styles.themeOption}
    >
      <View
        style={[
          styles.themeCard,
          { backgroundColor: tokens.bg, borderColor: tokens.border },
          selected && styles.themeCardActive,
        ]}
      >
        <View style={[styles.themePanel, { backgroundColor: tokens.bgRaised }]}>
          <View style={[styles.themeLine, { backgroundColor: tokens.text }]} />
          <View
            style={[
              styles.themeLineShort,
              { backgroundColor: tokens.textSecondary },
            ]}
          />
          <View style={styles.themeRow}>
            <View
              style={[styles.themeDot, { backgroundColor: tokens.accent }]}
            />
            <View
              style={[
                styles.themeChip,
                { backgroundColor: tokens.controlHover },
              ]}
            />
          </View>
        </View>
      </View>
      <Text style={[styles.themeLabel, selected && styles.themeLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}
