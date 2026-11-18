// the anchor now lives in the shared dropdown library; re-exported here so
// office views keep their single import point
export { MenuAnchor, MenuAnchorContext } from "../dropdown";
export { ChoiceMenu } from "./officeControls/ChoiceMenu";
export { ControlChip } from "./officeControls/ControlChip";
export { Segmented } from "./officeControls/Segmented";
export type { ControlOption } from "./officeControls/types";
