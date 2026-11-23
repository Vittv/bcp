import { useOfficeSettings } from "../../context/OfficeSettingsContext";
import type { OfficeId } from "../../lib/content/types";
import { readingsApply } from "../../lib/office/compose";
import type {
  ComposedSection,
  MenuChoices,
  MenuKey,
  OfficeChoices,
} from "../../lib/office/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import {
  ChoiceMenu,
  type ControlOption,
  MenuAnchor,
  Segmented,
} from "./OfficeControls";
import {
  allPsalmsLabel,
  INVITATORY_LABEL,
  MENU_META,
  READING_NO,
  slotName,
  truncate,
} from "./OfficeView.shared";
import { officeViewStyles } from "./OfficeView.styles";

export function SectionControl({
  sectionKey,
  officeId,
  choices,
}: {
  sectionKey: ComposedSection["key"];
  officeId: OfficeId;
  choices: OfficeChoices;
}) {
  const { customizationFor, setOfficeChoice } = useOfficeSettings();
  const customization = customizationFor(officeId);

  switch (sectionKey) {
    case "lessons": {
      if (!choices.lessonSlots || choices.lessonSlots.length === 0) return null;
      // a stored choice the day cannot honor (a feast's two readings under
      // an evening "Gospel only") shows as Suggested; the stored key
      // survives and rules again tomorrow
      const stored = customization.readings;
      const value =
        stored !== undefined && readingsApply(choices, stored)
          ? stored
          : "suggested";
      return (
        <ReadingsControl
          choices={choices}
          value={value}
          onChange={(id) =>
            setOfficeChoice(officeId, {
              readings: id === "suggested" ? undefined : id,
            })
          }
        />
      );
    }
    case "opening": {
      if (choices.openingGroups.length === 0) return null;
      const options: ControlOption[] = [
        {
          id: "suggested",
          label: choices.openingSuggested
            ? truncate(choices.openingSuggested, 52)
            : "Suggested",
          group: "Suggested",
        },
      ];
      const seen = new Set<string>();
      for (const group of choices.openingGroups) {
        for (const text of group.texts) {
          if (seen.has(text)) continue;
          seen.add(text);
          options.push({
            id: text,
            label: truncate(text, 64),
            group: group.season,
          });
        }
      }
      options.push({ id: "all", label: "All sentences", group: "Other" });
      return (
        <ChoiceMenu
          value={customization.opening ?? "suggested"}
          options={options}
          label="Opening Sentence"
          accessibilityLabel="Opening Sentence"
          fullWidth
          onChange={(id) =>
            setOfficeChoice(officeId, {
              opening: id === "suggested" ? undefined : id,
            })
          }
        />
      );
    }
    case "invitatory":
      if (officeId.startsWith("morning")) {
        return (
          <ChoiceMenu
            narrow
            value={customization.invitatory ?? "suggested"}
            options={[
              {
                id: "suggested",
                label:
                  choices.invitatorySuggested === "pascha"
                    ? INVITATORY_LABEL.pascha
                    : choices.invitatorySuggested === "phos"
                      ? "O Gracious Light"
                      : // SAFETY: morning invitatory suggestions are venite, jubilate, or pascha
                        INVITATORY_LABEL[
                          choices.invitatorySuggested as
                            | "venite"
                            | "jubilate"
                            | "pascha"
                        ],
                group: "Suggested",
              },
              { id: "venite", label: INVITATORY_LABEL.venite, group: "Psalms" },
              { id: "jubilate", label: INVITATORY_LABEL.jubilate },
              { id: "pascha", label: INVITATORY_LABEL.pascha },
            ]}
            label="Invitatory"
            accessibilityLabel="Invitatory Psalm"
            onChange={(id) =>
              setOfficeChoice(officeId, {
                invitatory:
                  id === "venite" || id === "jubilate" || id === "pascha"
                    ? id
                    : undefined,
              })
            }
          />
        );
      }
      return (
        <ChoiceMenu
          narrow
          value={customization.invitatory ?? "suggested"}
          options={[
            {
              id: "suggested",
              label: "O Gracious Light",
              group: "Suggested",
            },
            { id: "venite", label: INVITATORY_LABEL.venite, group: "Psalms" },
            { id: "jubilate", label: INVITATORY_LABEL.jubilate },
          ]}
          label="Invitatory"
          accessibilityLabel="Invitatory"
          onChange={(id) =>
            setOfficeChoice(officeId, {
              invitatory: id === "venite" || id === "jubilate" ? id : undefined,
            })
          }
        />
      );
    case "psalms":
      return choices.psalmCitations ? (
        <PsalmPicker officeId={officeId} citations={choices.psalmCitations} />
      ) : null;
    case "suffrages-a":
    case "suffrages-b":
      return (
        <Segmented
          value={customization.suffrages ?? choices.suffragesSuggested}
          options={[
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ]}
          accessibilityLabel="Suffrages"
          onChange={(id) =>
            setOfficeChoice(officeId, {
              suffrages: id === "a" ? "a" : "b",
            })
          }
        />
      );
    default:
      return null;
  }
}

export function PsalmPicker({
  officeId,
  citations,
}: {
  officeId: OfficeId;
  citations: string[];
}) {
  const { customizationFor, setOfficeChoice } = useOfficeSettings();
  const customization = customizationFor(officeId);
  if (citations.length < 2) return null;
  const stored = customization.psalmChoice;
  const options: ControlOption[] = [
    { id: "all", label: allPsalmsLabel(citations.length), group: "Suggested" },
    ...citations.map((citation) => ({
      id: citation,
      label: `Psalm ${citation}`,
    })),
  ];
  return (
    <ChoiceMenu
      narrow
      value={stored && citations.includes(stored) ? stored : "all"}
      options={options}
      label="Psalm"
      accessibilityLabel="Psalm"
      onChange={(id) =>
        setOfficeChoice(officeId, {
          psalmChoice: id === "all" ? undefined : id,
        })
      }
    />
  );
}

export function PsalmCycleControl({ officeId }: { officeId: OfficeId }) {
  const { customizationFor, setOfficeChoice } = useOfficeSettings();
  const customization = customizationFor(officeId);
  return (
    <Segmented
      value={customization.psalmCycle ?? "office"}
      options={[
        { id: "office", label: "Office" },
        { id: "psalter30", label: "30-Day" },
      ]}
      accessibilityLabel="Psalm source"
      onChange={(id) =>
        setOfficeChoice(officeId, {
          psalmCycle: id === "psalter30" ? "psalter30" : "office",
        })
      }
    />
  );
}

// the Readings picker: the day's full set restores the default (a missing
// stored key), then the one- and two-reading subsets. a day without a
// gospel shows a disabled row where the gospel choices would sit

export function ReadingsControl({
  choices,
  value,
  onChange,
}: {
  choices: Pick<OfficeChoices, "lessonSlots">;
  value: string;
  onChange: (id: string) => void;
}) {
  const slots = choices.lessonSlots ?? [];
  const options: ControlOption[] = [{ id: "suggested", label: "All readings" }];
  options.push(
    ...slots.map((slot) => ({
      id: String(READING_NO[slot.key]),
      group: "One reading",
      label: `${slotName(slot)} only`,
    })),
  );
  if (!slots.some((slot) => slot.key === "gospel")) {
    options.push({
      id: "disabled",
      group: "One reading",
      label: "No gospel appointed today",
      disabled: true,
    });
  }
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      options.push({
        id: `${READING_NO[slots[i].key]}${READING_NO[slots[j].key]}`,
        group: "Two readings",
        label: `${slotName(slots[i])} & ${slotName(slots[j])}`,
      });
    }
  }
  return (
    <ChoiceMenu
      value={value}
      options={options}
      label="Readings"
      accessibilityLabel="Readings"
      onChange={onChange}
    />
  );
}

export function MenuView({
  menu,
  set,
  officeId,
  heading = false,
}: {
  menu: MenuKey;
  set: MenuChoices;
  officeId: OfficeId;
  heading?: boolean;
}) {
  const styles = useThemedStyles(officeViewStyles);
  const { customizationFor, setOfficeChoice } = useOfficeSettings();
  const customization = customizationFor(officeId);
  const meta = MENU_META[menu];
  const stored = customization[meta.key];
  return (
    <MenuAnchor style={heading ? undefined : styles.menuControlRow}>
      <ChoiceMenu
        fullWidth={!heading}
        value={stored ?? "suggested"}
        options={set.options}
        label={meta.label}
        accessibilityLabel={meta.a11y}
        onChange={(id) => {
          if (id === "suggested") {
            setOfficeChoice(officeId, { [meta.key]: undefined });
            return;
          }
          const patch =
            menu === "psalm"
              ? { psalmMenu: id }
              : menu === "reading"
                ? { readingMenu: id }
                : { collectMenu: id };
          setOfficeChoice(officeId, patch);
        }}
      />
    </MenuAnchor>
  );
}
