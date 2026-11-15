import type { ReactNode } from "react";

import type { CalendarDate } from "../../../lib/calendar/types";
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
import { OfficeTabs } from "../OfficeTabs";
import type { PageId } from "../Sidebar";
import type { TabId } from "./shellUtils";
import { today } from "./shellUtils";

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
  showRubrics: boolean;
  showSpeakers: boolean;
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
    showRubrics,
    showSpeakers,
    sidebarShowButton,
    lectionaryDate,
    isMobile,
    fontScale,
    reportScroll,
  } = ctx;

  switch (page) {
    case "today":
      return (
        <TodayScreen
          key={`${date.year}-${date.month}-${date.day}-${tab}-${rite}-${devotions ? "dev" : "full"}`}
          date={date}
          tab={tab}
          onTabChange={handleTabChange}
          document={document}
          showRubrics={showRubrics}
          showSpeakers={showSpeakers}
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
