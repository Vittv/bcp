import { type ReactNode, useState } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
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

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "morning", label: "Morning", short: "Morn" },
  { id: "noonday", label: "Noonday", short: "Noon" },
  { id: "evening", label: "Evening", short: "Eve" },
  { id: "compline", label: "Compline", short: "Comp" },
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
  const { width: viewportWidth } = useViewport();
  // the bar's own width, since the sidebar and the UI scale both shrink it
  // well below the window; the effective viewport is the first paint
  const [barWidth, setBarWidth] = useState(0);
  const width = barWidth || viewportWidth;
  // abbreviated labels kick in before phone widths; tighter chrome later
  const shortLabels = width < 640;
  const compact = width < WIDTH_COMPACT;
  const showRite = !devotions && (active === "morning" || active === "evening");
  // below this the reading toggles no longer fit beside the tabs and rite;
  // Settings -> Office still offers both
  const showReadingToggles = width >= 400;
  return (
    <View
      style={[styles.bar, noSelect]}
      onLayout={(e: LayoutChangeEvent) =>
        setBarWidth(e.nativeEvent.layout.width)
      }
    >
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
          <SteadyToggleText
            text={shortLabels ? "Devotions" : "Daily Devotions"}
            on={devotions}
          />
        </Pressable>
        {TABS.map((t) => {
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
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {shortLabels ? t.short : t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {showReadingToggles || showRite ? (
        <View style={[styles.togglesRight, compact && styles.groupCompact]}>
          {showReadingToggles ? (
            <>
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
            </>
          ) : null}
          {showRite ? (
            <BarDropdown
              value={rite}
              options={RITE_OPTIONS}
              onChange={onRiteChange}
              accent
              steadyWidth
              accessibilityLabel="Office rite"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export type { TabId };
