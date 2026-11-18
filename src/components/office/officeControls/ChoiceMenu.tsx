import { useViewport } from "../../../lib/viewport";
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  type DropdownWidth,
} from "../../dropdown";
import type { ControlOption } from "./types";

// the office's option picker, now a thin wrapper over the shared page
// dropdown. keeps the ControlOption contract its many callers rely on.
export function ChoiceMenu({
  value,
  options,
  onChange,
  label,
  accessibilityLabel,
  fullWidth = false,
  narrow = false,
}: {
  value: string;
  options: readonly ControlOption[];
  onChange: (id: string) => void;
  label: string;
  accessibilityLabel: string;
  fullWidth?: boolean;
  narrow?: boolean;
}) {
  const { compact } = useViewport();
  const current = options.find((option) => option.id === value);
  const width: DropdownWidth = fullWidth
    ? "full"
    : narrow
      ? compact
        ? 130
        : 150
      : compact
        ? 210
        : 260;

  let lastGroup: string | undefined;
  return (
    <Dropdown
      triggerLabel={current?.label ?? label}
      accessibilityLabel={accessibilityLabel}
      width={width}
    >
      {options.map((option) => {
        const header =
          option.group && option.group !== lastGroup ? option.group : undefined;
        const afterGroup = header !== undefined && lastGroup !== undefined;
        lastGroup = option.group;
        return (
          <DropdownItemRow
            key={option.id}
            header={header}
            afterGroup={afterGroup}
            option={option}
            selected={option.id === value}
            onPress={() => {
              onChange(option.id);
            }}
          />
        );
      })}
    </Dropdown>
  );
}

function DropdownItemRow({
  header,
  afterGroup,
  option,
  selected,
  onPress,
}: {
  header?: string;
  afterGroup: boolean;
  option: ControlOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <>
      {header ? <DropdownGroup label={header} afterGroup={afterGroup} /> : null}
      <DropdownItem
        label={option.menuLabel ?? option.label}
        selected={selected}
        disabled={option.disabled}
        onPress={onPress}
      />
    </>
  );
}
