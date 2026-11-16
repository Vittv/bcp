import { Platform, ScrollView } from "react-native";
import { OfficeHeader } from "../components/office/OfficeHeader";
import { OfficeToc, useOfficeTocVisible } from "../components/office/OfficeToc";
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
  showSections: boolean;
};

export function TodayScreen({
  document,
  showRubrics,
  showSpeakers,
  showSections,
}: TodayScreenProps) {
  const isDailyOffice =
    document.office.startsWith("morning") ||
    document.office.startsWith("evening");
  const showToc = useOfficeTocVisible(isDailyOffice, showSections);

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

  if (IS_WEB) {
    if (!showToc) return inner;
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(0, 46rem) 1fr",
          alignItems: "stretch",
          width: "100%",
        }}
      >
        <div aria-hidden />
        <div
          style={{
            width: "100%",
            maxWidth: "46rem",
            justifySelf: "center",
            alignSelf: "start",
          }}
        >
          {inner}
        </div>
        <div style={{ paddingLeft: 24, minWidth: 0, alignSelf: "stretch" }}>
          <div style={{ position: "sticky", top: 24 }}>
            <OfficeToc document={document} />
          </div>
        </div>
      </div>
    );
  }

  return <ScrollView>{inner}</ScrollView>;
}
