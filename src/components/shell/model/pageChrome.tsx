import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { BcpEdition } from "../../../context/EditionContext";
import type { CalendarDate } from "../../../lib/calendar/types";
import type { Bcp1662ComposedOffice } from "../../../lib/content/bcp1662";
import {
  type Bcp1962ComposedOffice,
  composeBcp1962Compline,
  composeBcp1962FamilyPrayer,
  composeBcp1962Litany,
  composeBcp1962Noonday,
} from "../../../lib/content/bcp1962";
import type { OfficeDocument, OfficeRite } from "../../../lib/office/types";
import {
  BibleBar,
  BibleReaderScreen,
} from "../../../screens/BibleReaderScreen";
import { CalendarScreen } from "../../../screens/CalendarScreen";
import {
  LectionaryBar,
  LectionaryScreen,
} from "../../../screens/LectionaryScreen";
import {
  CanticlesBar,
  CanticlesScreen,
  CollectsBar,
  CollectsScreen,
  LesserFeastsBar,
  LesserFeastsScreen,
  OfficesBar,
  OfficesScreen,
  ProverbsBar,
  ProverbsScreen,
  PsalmsBar,
  PsalmsScreen,
  PsalterBar,
  PsalterScreen,
  SaintsBar,
  SaintsScreen,
} from "../../../screens/reference";
import { TodayScreen } from "../../../screens/TodayScreen";
import { Bcp1662OfficeView } from "../../office/Bcp1662OfficeView";
import { Bcp1962LitanyView } from "../../office/Bcp1962LitanyView";
import { Bcp1962OfficeView } from "../../office/Bcp1962OfficeView";
import { OfficeTabs } from "../OfficeTabs";
import type { PageId } from "../Sidebar";
import {
  is1662OfficeTab,
  is1962OfficeTab,
  type TabId,
  today,
} from "./shellUtils";

export type AuxRowContext = {
  page: PageId;
  sidebarShowButton: ReactNode;
  tab: TabId;
  handleTabChange: (t: TabId) => void;
  showRubrics: boolean;
  setShowRubrics: (update: boolean | ((prev: boolean) => boolean)) => void;
  showSpeakers: boolean;
  setShowSpeakers: (update: boolean | ((prev: boolean) => boolean)) => void;
  devotions: boolean;
  setDevotions: (v: boolean) => void;
  rite: OfficeRite;
  setRite: (r: OfficeRite) => void;
  isMobile: boolean;
  date: CalendarDate;
  pickDate: (date: CalendarDate) => void;
  lectionaryDate: CalendarDate;
  stepLectionary: (delta: number) => void;
  resetLectionaryDate: () => void;
};

export function renderAuxRow(ctx: AuxRowContext): ReactNode {
  const {
    page,
    sidebarShowButton,
    tab,
    handleTabChange,
    showRubrics,
    setShowRubrics,
    showSpeakers,
    setShowSpeakers,
    devotions,
    setDevotions,
    rite,
    setRite,
    isMobile,
    date,
    pickDate,
    lectionaryDate,
    stepLectionary,
    resetLectionaryDate,
  } = ctx;

  switch (page) {
    case "psalms":
      return <PsalmsBar leading={sidebarShowButton} />;
    case "psalter":
      return <PsalterBar leading={sidebarShowButton} />;
    case "canticles":
      return <CanticlesBar leading={sidebarShowButton} />;
    case "collects":
      return <CollectsBar leading={sidebarShowButton} />;
    case "offices":
      return <OfficesBar leading={sidebarShowButton} isMobile={isMobile} />;
    case "saints":
      return <SaintsBar leading={sidebarShowButton} />;
    case "lesser-feasts":
      return <LesserFeastsBar leading={sidebarShowButton} />;
    case "proverbs":
      return <ProverbsBar leading={sidebarShowButton} />;
    case "old-testament":
    case "new-testament":
    case "apocrypha":
      return <BibleBar leading={sidebarShowButton} />;
    case "today":
      return (
        <OfficeTabs
          leading={sidebarShowButton}
          active={tab}
          onSelect={handleTabChange}
          date={date}
          onPickDate={pickDate}
          showRubrics={showRubrics}
          onToggleRubrics={() => setShowRubrics((v) => !v)}
          showSpeakers={showSpeakers}
          onToggleSpeakers={() => setShowSpeakers((v) => !v)}
          devotions={devotions}
          onToggleDevotions={() => setDevotions(!devotions)}
          rite={rite}
          onRiteChange={setRite}
        />
      );
    case "lectionary":
      return (
        <LectionaryBar
          leading={sidebarShowButton}
          isToday={(() => {
            const n = today();
            return (
              n.year === lectionaryDate.year &&
              n.month === lectionaryDate.month &&
              n.day === lectionaryDate.day
            );
          })()}
          onPrevDate={() => stepLectionary(-1)}
          onNextDate={() => stepLectionary(1)}
          onToday={resetLectionaryDate}
        />
      );
    default:
      return null;
  }
}

export type ContentContext = {
  page: PageId;
  date: CalendarDate;
  tab: TabId;
  rite: OfficeRite;
  devotions: boolean;
  handleTabChange: (t: TabId) => void;
  document: OfficeDocument;
  edition: BcpEdition;
  bcp1662TodayDoc: Bcp1662ComposedOffice | null;
  bcp1662TodayLoading: boolean;
  bcp1962TodayDoc: Bcp1962ComposedOffice | null;
  bcp1962TodayLoading: boolean;
  showRubrics: boolean;
  showSpeakers: boolean;
  showSections: boolean;
  sidebarShowButton: ReactNode;
  lectionaryDate: CalendarDate;
  isMobile: boolean;
  fontScale: number;
  reportScroll: (pct: number) => void;
};

export function renderContent(ctx: ContentContext): ReactNode {
  const {
    page,
    date,
    tab,
    rite,
    devotions,
    handleTabChange,
    document,
    edition,
    bcp1662TodayDoc,
    bcp1662TodayLoading,
    bcp1962TodayDoc,
    bcp1962TodayLoading,
    showRubrics,
    showSpeakers,
    showSections,
    sidebarShowButton,
    lectionaryDate,
    isMobile,
    fontScale,
    reportScroll,
  } = ctx;

  switch (page) {
    case "today":
      if (edition === "1962" && devotions) {
        return (
          <Bcp1962OfficeView
            doc={composeBcp1962FamilyPrayer(
              tab === "litany" ? "morning" : tab,
              date,
            )}
            showRubrics={showRubrics}
            showSpeakers={showSpeakers}
          />
        );
      }
      if (edition === "1962") {
        if (tab === "litany") {
          return (
            <Bcp1962LitanyView
              doc={composeBcp1962Litany(date)}
              showRubrics={showRubrics}
              showSpeakers={showSpeakers}
            />
          );
        }
        if (tab === "noonday" || tab === "compline") {
          return (
            <Bcp1962OfficeView
              doc={
                tab === "noonday"
                  ? composeBcp1962Noonday(date)
                  : composeBcp1962Compline(date)
              }
              showRubrics={showRubrics}
              showSpeakers={showSpeakers}
            />
          );
        }
        if (!is1962OfficeTab(tab)) {
          return (
            <View>
              <Text style={{ opacity: 0.7 }}>
                This office is not yet available in the 1962 Book of Common
                Prayer.
              </Text>
            </View>
          );
        }
        if (bcp1962TodayLoading && !bcp1962TodayDoc) {
          return (
            <View>
              <Text style={{ opacity: 0.7 }}>Composing office…</Text>
            </View>
          );
        }
        if (!bcp1962TodayDoc) return null;
        return (
          <Bcp1962OfficeView
            doc={bcp1962TodayDoc}
            showRubrics={showRubrics}
            showSpeakers={showSpeakers}
          />
        );
      }
      if (edition === "1662") {
        if (!is1662OfficeTab(tab)) {
          return (
            <View>
              <Text style={{ opacity: 0.7 }}>
                This office is not yet available in the 1662 Book of Common
                Prayer.
              </Text>
            </View>
          );
        }
        if (bcp1662TodayLoading && !bcp1662TodayDoc) {
          return (
            <View>
              <Text style={{ opacity: 0.7 }}>Composing office…</Text>
            </View>
          );
        }
        if (!bcp1662TodayDoc) return null;
        return (
          <Bcp1662OfficeView
            doc={bcp1662TodayDoc}
            showRubrics={showRubrics}
            showSpeakers={showSpeakers}
          />
        );
      }
      return (
        <TodayScreen
          key={`${date.year}-${date.month}-${date.day}-${tab}-${rite}-${devotions ? "dev" : "full"}`}
          date={date}
          tab={tab}
          onTabChange={handleTabChange}
          document={document}
          showRubrics={showRubrics}
          showSpeakers={showSpeakers}
          showSections={showSections}
        />
      );
    case "calendar":
      return <CalendarScreen leading={sidebarShowButton} />;
    case "lectionary":
      return <LectionaryScreen date={lectionaryDate} />;
    case "psalms":
      return (
        <PsalmsScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    case "psalter":
      return (
        <PsalterScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    case "canticles":
      return (
        <CanticlesScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    case "collects":
      return (
        <CollectsScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    case "offices":
      return (
        <OfficesScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    case "saints":
      return (
        <SaintsScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    case "lesser-feasts":
      return (
        <LesserFeastsScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    case "proverbs":
      return (
        <ProverbsScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    case "old-testament":
    case "new-testament":
    case "apocrypha":
      return (
        <BibleReaderScreen
          isMobile={isMobile}
          fontScale={fontScale}
          onScrollProgress={reportScroll}
        />
      );
    default:
      return null;
  }
}
