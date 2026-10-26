import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type { OfficeId } from "../../lib/content/types";
import type { OfficeRite } from "../../lib/office/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { useViewport, WIDTH_COMPACT } from "../../lib/viewport";
import { BarDropdown, type DropdownOption } from "./BarDropdown";
import { officeBarStyles } from "./officeBarStyles";

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

type TabId = "morning" | "noonday" | "evening" | "compline";

const RITE_OPTIONS: readonly DropdownOption<OfficeRite>[] = [
  { id: "One", label: "Rite I" },
  { id: "Two", label: "Rite II" },
];

// daily devotions (BCP pp. 136-140) replace each office in devotions mode.
export const DEVOTIONS: Record<TabId, OfficeId> = {
  morning: "devotions-morning",
  noonday: "devotions-noon",
  evening: "devotions-evening",
  compline: "devotions-close",
};

const TABS: { id: TabId; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "noonday", label: "Noonday" },
  { id: "evening", label: "Evening" },
  { id: "compline", label: "Compline" },
];

// an invisible bold twin reserves the label's widest metrics, so the visible
// text can bold on activate without reflowing the bar
function SteadyToggleText({ text, on }: { text: string; on: boolean }) {
  const styles = useThemedStyles(officeBarStyles);
  return (
    <View style={styles.steadyText}>
      <Text style={[styles.toggleText, styles.steadyTextGhost]}>{text}</Text>
      <Text
        style={[
          styles.toggleText,
          styles.steadyTextLabel,
          on && styles.toggleTextOn,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

type OfficeTabsProps = {
  leading?: ReactNode;
  active: TabId;
  onSelect: (id: TabId) => void;
  showRubrics: boolean;
  onToggleRubrics: () => void;
  showSpeakers: boolean;
  onToggleSpeakers: () => void;
  devotions: boolean;
  onToggleDevotions: () => void;
  rite: OfficeRite;
  onRiteChange: (r: OfficeRite) => void;
};

export function OfficeTabs({
  leading,
  active,
  onSelect,
  showRubrics,
  onToggleRubrics,
  showSpeakers,
  onToggleSpeakers,
  devotions,
  onToggleDevotions,
  rite,
  onRiteChange,
}: OfficeTabsProps) {
  const styles = useThemedStyles(officeBarStyles);
  const { width } = useViewport();
  // the full row needs about 600px of bar, which a desktop window only has
  // from 800px with the sidebar open
  const tabsAsMenu = width < 800;
  // the reading toggles abbreviate first, then the bar's padding tightens
  const shortLabels = width < 640;
  const compact = width < WIDTH_COMPACT;
  const devotionsLabel =
    width >= 640 ? "Daily Devotions" : width < 400 ? "Dev" : "Devotions";
  const showRite = !devotions && (active === "morning" || active === "evening");
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={[styles.tabsLeft, compact && styles.groupCompact]}>
        {leading}
        <Pressable
          style={({ hovered }) => [
            styles.toggle,
            styles.modeToggle,
            compact && styles.itemCompact,
            hovered && styles.tabHover,
            devotions && styles.modeToggleOn,
          ]}
          onPress={onToggleDevotions}
          accessibilityRole="button"
          accessibilityState={{ selected: devotions }}
          accessibilityLabel="Daily Devotions"
        >
          <SteadyToggleText text={devotionsLabel} on={devotions} />
        </Pressable>
        {tabsAsMenu ? (
          <BarDropdown
            value={active}
            options={TABS}
            onChange={onSelect}
            align="start"
            accent
            plain
            steadyWidth
            accessibilityLabel="Office"
          />
        ) : (
          TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => onSelect(t.id)}
                style={({ hovered }) => [
                  styles.tab,
                  compact && styles.itemCompact,
                  hovered && styles.tabHover,
                ]}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
      <View style={[styles.togglesRight, compact && styles.groupCompact]}>
        <Pressable
          style={({ hovered }) => [
            styles.toggle,
            compact && styles.itemCompact,
            hovered && styles.tabHover,
          ]}
          onPress={onToggleRubrics}
          accessibilityRole="button"
          accessibilityState={{ selected: showRubrics }}
          accessibilityLabel="Rubrics"
        >
          <SteadyToggleText
            text={shortLabels ? "Rubr" : "Rubrics"}
            on={showRubrics}
          />
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.toggle,
            compact && styles.itemCompact,
            hovered && styles.tabHover,
          ]}
          onPress={onToggleSpeakers}
          accessibilityRole="button"
          accessibilityState={{ selected: showSpeakers }}
          accessibilityLabel="Speakers"
        >
          <SteadyToggleText
            text={shortLabels ? "Spk" : "Speakers"}
            on={showSpeakers}
          />
        </Pressable>
        {showRite ? (
          <BarDropdown
            value={rite}
            options={RITE_OPTIONS}
            onChange={onRiteChange}
            accent
            plain
            steadyWidth
            accessibilityLabel="Office rite"
          />
        ) : null}
      </View>
    </View>
  );
}

export type { TabId };
