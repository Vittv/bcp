export type ControlOption = {
  id: string;
  label: string;
  /** the popover row's text when it should differ from the trigger's */
  menuLabel?: string;
  /** rows sharing a group are preceded once by this heading */
  group?: string;
  /** unusable today; shown dimmed and unselectable, where the choice
   * would sit if the day provided it */
  disabled?: boolean;
};
