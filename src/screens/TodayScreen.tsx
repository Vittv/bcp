import { Platform, ScrollView } from "react-native";
import { OfficeHeader } from "../components/office/OfficeHeader";
import { OfficeView } from "../components/office/OfficeView";
import type { TabId } from "../components/shell/OfficeTabs";
import type { CalendarDate } from "../lib/calendar/types";
import type { OfficeDocument } from "../lib/office/types";

const IS_WEB = Platform.OS === "web";

type TodayScreenProps = {
  date: CalendarDate;
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  document: OfficeDocument;
  showRubrics: boolean;
  showSpeakers: boolean;
};

export function TodayScreen({
  document,
  showRubrics,
  showSpeakers,
}: TodayScreenProps) {
  const inner = (
    <>
      <OfficeHeader document={document} />
      <OfficeView
        document={document}
        showRubrics={showRubrics}
        showSpeakers={showSpeakers}
      />
    </>
  );

  if (IS_WEB) return inner;
  return <ScrollView>{inner}</ScrollView>;
}
