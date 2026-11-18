import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { SaintPopoverProvider } from "../../components/office/SaintPopover";
import { PullChevron } from "../../components/shell/Chevron";
import { type HintHandle, HintLayer } from "../../components/shell/HintLayer";
import { SidebarIcon } from "../../components/shell/Icon";
import type { PageId, SidebarDetail } from "../../components/shell/Sidebar";
import { Sidebar } from "../../components/shell/Sidebar";
import { useAutoscroll } from "../../components/shell/useAutoscroll";
import {
  BibleProvider,
  openingRef,
  pageForBook,
  savedPositions,
  setBiblePendingRef,
  type Testament,
} from "../../context/BibleContext";
import { useEdition } from "../../context/EditionContext";
import {
  HistoryProvider,
  type HistorySnapshot,
} from "../../context/HistoryContext";
import {
  type NavigateToRef,
  NavigationContext,
} from "../../context/NavigationContext";
import { useOfficeSettings } from "../../context/OfficeSettingsContext";
import { PaletteProvider } from "../../context/PaletteContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "../../context/TranslationContext";
import {
  addDays,
  colorFor,
  daysUntilNextSeason,
  resolve,
  seasonFor,
  upcomingLesserFeast,
  upcomingSanctoraleEntry,
} from "../../lib/calendar";
import { bcp1662CycleLabel } from "../../lib/calendar/bcp1662";
import type { CalendarDate } from "../../lib/calendar/types";
import {
  type Bcp1662ComposedOffice,
  composeBcp1662OfficeForDate,
} from "../../lib/content/bcp1662";
import { prefetchAllScripture } from "../../lib/content/prefetchScripture";
import { psalterDayForDate } from "../../lib/content/psalterDays";
import {
  IS_LINUX_CHROMIUM,
  IS_TAURI,
  IS_WINDOWS_TAURI,
} from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import { composeOffice } from "../../lib/office";
import { dailyOfficeId } from "../../lib/office/daily";
import { DEFAULT_PREFS } from "../../lib/office/types";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";
import { useAppVersion } from "../../lib/version";
import { useViewport, WIDTH_MOBILE } from "../../lib/viewport";
import { ReferenceProvider } from "../../screens/reference";
import { PaletteHost } from "../../screens/reference/PaletteHost";
import { AutoscrollGlyph } from "./components/AutoscrollGlyph";
import { useDrawerLayer } from "./hooks/useDrawerLayer";
import { useScrollTracking } from "./hooks/useScrollTracking";
import { useShellHistoryIntegration } from "./hooks/useShellHistoryIntegration";
import { useShellKeyboard } from "./hooks/useShellKeyboard";
import { useShellModalFlow } from "./hooks/useShellModalFlow";
import { useWindowControlPrefs } from "./hooks/useWindowControlPrefs";
import { renderAuxRow, renderContent } from "./model/pageChrome";
import {
  ensureSidebarAnimStyle,
  holyDayCountdown,
  IS_WEB,
  isReferencePage,
  OFFICE_LABEL,
  OFFICE_LABEL_1662,
  officeForHour,
  officeForHour1662,
  type TabId,
  today,
  u,
} from "./model/shellUtils";
import { DEVOTIONS } from "./OfficeTabs";
import { ScriptureLoadingBar } from "./ScriptureLoadingBar";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";
import { UpdateBanner } from "./UpdateBanner";

export function Shell() {
  const { fontScale, uiScale, tokens } = useTheme();
  const { edition } = useEdition();
  const styles = useThemedStyles(shellStyles);
  const v = useThemeVar();

  useEffect(() => {
    if (Platform.OS === "web") ensureSidebarAnimStyle();
  }, []);

  // keep all scripture chunks cached for full offline use, without blocking startup
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window)
      return;
    const run = () => {
      void prefetchAllScripture();
    };
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(run, 1500);
    return () => clearTimeout(id);
  }, []);

  const [date, setDate] = useState<CalendarDate>(today);
  // the lectionary keeps its own date, independent of the office date shown
  // on Today; stepping its prev/next/today never touches the global date
  const [lectionaryDate, setLectionaryDate] = useState<CalendarDate>(today);
  const [tab, setTab] = useState<TabId>(() =>
    edition === "1662"
      ? officeForHour1662(new Date().getHours())
      : officeForHour(new Date().getHours()),
  );
  const [page, setPage] = useState<PageId>("today");
  // increments on every navigation (including re-entering the same
  // page), so reference searches reset each time a page is entered
  const [navKey, setNavKey] = useState(0);
  // desktop reports the binary version (web the bundled one); it drives both
  // the notes shown and the after-update trigger below
  const appVersion = useAppVersion();
  const [reading, setReading] = useState<string | null>(null);

  // breakpoints follow the space inside the zoom, not the raw window: a large
  // UI scale is equivalent to a narrower screen. native does not zoom.
  const viewport = useViewport();
  const viewportWidth = viewport.width;
  const isMobile = Platform.OS !== "web" || viewport.isMobile;
  // the settings modal is outside the zoom, so its layout follows the raw
  // window rather than the zoomed width
  const settingsMobile =
    Platform.OS !== "web" || viewport.rawWidth < WIDTH_MOBILE;

  const {
    windowControlStyle,
    setWindowControlStyle,
    resolvedWindowControlStyle,
  } = useWindowControlPrefs();
  const { modal, setModal, setSettingsSection, handleOpenModal, modalContent } =
    useShellModalFlow({
      appVersion,
      settingsMobile,
      windowControlStyle,
      setWindowControlStyle,
      changelogVersionStyle: styles.changelogVersion,
    });

  const modalRef = useRef(modal);
  modalRef.current = modal;

  const {
    mobileOpen,
    setMobileOpen,
    mobileOpenRef,
    draggingDrawer,
    drawerRef,
    sidebarVisible,
    toolbarLabels,
    openSidebar,
    hideSidebar,
    swipeHandlers,
  } = useDrawerLayer({
    isMobile,
    modal,
    viewportWidth,
  });

  // scroll-click (middle button) autoscroll, custom where no native gesture
  // is dependable: the Linux and macOS desktop shells (WebKitGTK, WKWebView
  // have none) and Chromium on Linux. Windows WebView2 and the rest of the
  // web keep their native behaviours.
  const autoscroll = useAutoscroll(
    (IS_TAURI && !IS_WINDOWS_TAURI) || IS_LINUX_CHROMIUM,
  );

  const {
    showRubrics,
    setShowRubrics,
    showSpeakers,
    setShowSpeakers,
    showSections,
    devotions,
    setDevotions,
    rite,
    setRite,
    customizationFor,
  } = useOfficeSettings();
  const { scrollRef, scrollPct, reportScroll, handleScroll, scrollToTop } =
    useScrollTracking();
  const hintsRef = useRef<HintHandle>(null);

  const historyController = useShellHistoryIntegration({
    page,
    setPage,
    date,
    setDate,
    tab,
    setTab,
    modal,
    modalRef,
    setModal,
    setSettingsSection,
    mobileOpen,
    mobileOpenRef,
    setMobileOpen,
    isMobile,
    setReading,
    scrollToTop,
  });

  const handleTabChange = (t: TabId) => {
    setTab(t);
    historyController?.push({ tab: t });
    scrollToTop();
  };

  const stepLectionary = (delta: number) => {
    setLectionaryDate((d) => addDays(d, delta));
    scrollToTop();
  };

  const resetLectionaryDate = () => {
    setLectionaryDate(today);
    scrollToTop();
  };

  // one navigation funnel: pushes the history entry, then applies the page
  // change the way every navigation does (fresh search key, cleared reading,
  // drawer + scroll reset)
  const goToPage = useCallback(
    (p: PageId, extra: Partial<HistorySnapshot> = {}) => {
      // query is forced empty so a cross-page entry never carries a live
      // filter: the search starts fresh per navigation (mirrors the navKey
      // reset below) instead of leaking into Forward restores
      const change = { ...extra, page: p, query: "" };
      historyController?.push(change);
      setPage(p);
      setNavKey((k) => k + 1);
      setReading(null);
      if (isMobile) setMobileOpen(false);
      scrollToTop();
    },
    [historyController, isMobile, scrollToTop, setMobileOpen],
  );

  const handlePageSelect = (p: PageId) => {
    goToPage(p);
  };

  const handleNavigateTo = useCallback(
    (target: NavigateToRef | PageId) => {
      if (typeof target === "string") {
        goToPage(target);
        return;
      }
      if (target.bookAbbrev && target.chapter) {
        const page = pageForBook(target.bookAbbrev);
        if (!page) return;
        setBiblePendingRef({
          abbrev: target.bookAbbrev,
          chapter: target.chapter,
        });
        // the snapshot carries the exact ref too, so Back/Forward restore
        // the chapter even though it is applied through the pending-ref path
        goToPage(page, {
          bible: { abbrev: target.bookAbbrev, chapter: target.chapter },
        });
        return;
      }
      const extra: Partial<HistorySnapshot> = {};
      if (target.psalm !== undefined) extra.psalm = target.psalm;
      if (target.psalterDay !== undefined) extra.psalterDay = target.psalterDay;
      if (target.collect !== undefined) extra.collect = target.collect;
      if (target.saint !== undefined) extra.saint = target.saint;
      if (target.lesserFeast !== undefined)
        extra.lesserFeast = target.lesserFeast;
      if (target.proverb !== undefined) extra.proverb = target.proverb;
      if (target.canticle !== undefined) extra.canticle = target.canticle;
      goToPage(target.page, extra);
    },
    [goToPage],
  );

  useShellKeyboard({
    modal,
    setModal,
    setSettingsSection,
    page,
    date,
    setDate,
    setLectionaryDate,
    goToPage,
    isMobile,
    mobileOpenRef,
    setMobileOpen,
    scrollRef,
    hintsRef,
  });

  const officeId = devotions ? DEVOTIONS[tab] : dailyOfficeId(tab, rite);
  const document = composeOffice(date, officeId, {
    ...DEFAULT_PREFS,
    rite,
    personalMode: false,
    showRubrics,
    customization: customizationFor(officeId),
  });

  const [bcp1662TodayDoc, setBcp1662TodayDoc] =
    useState<Bcp1662ComposedOffice | null>(null);
  const [bcp1662TodayLoading, setBcp1662TodayLoading] = useState(false);

  useEffect(() => {
    if (edition !== "1662") return;
    if (devotions) {
      setDevotions(false);
    }
    if (tab !== "morning" && tab !== "evening") {
      setTab(officeForHour1662(new Date().getHours()));
    }
  }, [devotions, edition, setDevotions, tab]);

  useEffect(() => {
    if (edition !== "1662" || page !== "today") return;
    if (tab !== "morning" && tab !== "evening") {
      setBcp1662TodayDoc(null);
      setBcp1662TodayLoading(false);
      return;
    }
    let cancelled = false;
    setBcp1662TodayLoading(true);
    void composeBcp1662OfficeForDate(date, tab)
      .then((doc) => {
        if (!cancelled) setBcp1662TodayDoc(doc);
      })
      .catch(() => {
        if (!cancelled) setBcp1662TodayDoc(null);
      })
      .finally(() => {
        if (!cancelled) setBcp1662TodayLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [edition, page, tab, date]);
  // the app's season context (top bar and status bar) always reflects the
  // real current date, never a date a page happened to be scrolled to; only
  // the Today office body (`document` above) follows the stepped office date
  const season = seasonFor(today());
  const seasonColor = colorFor(today());
  const slot = resolve(today());
  const cycleLabel = edition === "1662" ? bcp1662CycleLabel(today()) : null;
  const { days: daysUntilNext, label: nextSeason } = daysUntilNextSeason(
    today(),
  );

  // the sidebar's per-row trailing info: the office of the hour for Today, the
  // countdown to the next fixed feast on Holy Days and the next lesser feast
  // on its row, and each scripture corpus's own "where reading stopped" on
  // its row. all are read from
  // storage because the bible context is cleared on every navigation, and
  // they are un-memoized so a progress reset cannot leave a stale label behind
  const now = today();
  const nextFeast = upcomingSanctoraleEntry(now);
  // the corpus the reader has selected, so the apocrypha row reads the
  // deuterocanonical corpus's own last place rather than the other one's
  const { apocrypha } = useTranslation();
  const saved = savedPositions(apocrypha);
  // abbreviated, not the full name: the row shares one narrow column with
  // "Old Testament", and "1 Thessalonians 12" is wide enough to push the label
  // into the ellipsis it yields to the detail. the Apocrypha row's own books
  // abbreviate shorter still ("Sir", "Pr Man").
  //
  // with nothing saved it names where the corpus would open, so an untouched
  // row still answers "where would this take me" instead of sitting blank.
  // that is the reader's position either way, since nothing saved means the
  // first chapter is what they would land on
  const readingDetail = (t: Testament): SidebarDetail | undefined => {
    const pos = saved[t] ?? openingRef(t, apocrypha);
    return pos ? { text: `${pos.abbrev} ${pos.chapter}` } : undefined;
  };
  const nextLesserFeast = upcomingLesserFeast(now);
  const sidebarDetail: Partial<Record<PageId, SidebarDetail>> = {
    today: {
      text: (() => {
        const currentTab =
          edition === "1662"
            ? officeForHour1662(new Date().getHours())
            : officeForHour(new Date().getHours());
        return edition === "1662"
          ? (OFFICE_LABEL_1662[currentTab] ?? OFFICE_LABEL[currentTab])
          : OFFICE_LABEL[currentTab];
      })(),
    },
    saints: nextFeast
      ? {
          text: holyDayCountdown(nextFeast, now),
          isToday: nextFeast.month === now.month && nextFeast.day === now.day,
        }
      : undefined,
    "lesser-feasts": {
      text: holyDayCountdown(nextLesserFeast, now),
      isToday:
        nextLesserFeast.month === now.month && nextLesserFeast.day === now.day,
    },
    "old-testament": readingDetail("OT"),
    "new-testament": readingDetail("NT"),
    apocrypha: readingDetail("DC"),
    psalter: { text: `Day ${psalterDayForDate(now)}` },
  };

  const sidebarShowButton =
    !sidebarVisible && !(IS_WEB && isMobile) ? (
      <Pressable
        style={styles.auxShowHit}
        onPress={openSidebar}
        accessibilityLabel="Show sidebar"
        accessibilityRole="button"
      >
        {({ hovered, pressed }) => (
          <View
            style={[
              styles.auxShowBtn,
              (hovered || pressed) && styles.auxShowBtnHover,
            ]}
          >
            <SidebarIcon
              size={14}
              color={hovered ? v("var(--text)") : v("var(--text-secondary)")}
            />
          </View>
        )}
      </Pressable>
    ) : null;

  // every page gets the auxiliary 30px row under the TopBar: the
  // page's own bar where one exists, otherwise a bare strip
  const auxRow = renderAuxRow({
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
  });
  const content = renderContent({
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
    showRubrics,
    showSpeakers,
    showSections,
    sidebarShowButton,
    lectionaryDate,
    isMobile,
    fontScale,
    reportScroll,
  });

  if (IS_WEB) {
    return (
      <HistoryProvider controller={historyController}>
        <ReferenceProvider
          onReadingChange={setReading}
          page={page}
          navKey={navKey}
        >
          <BibleProvider
            page={page}
            navKey={navKey}
            onReadingChange={setReading}
            onChapterChange={scrollToTop}
          >
            <NavigationContext.Provider
              value={{ navigateTo: handleNavigateTo }}
            >
              <PaletteProvider>
                <SaintPopoverProvider>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      // percentage widths resolve inside the zoom, but vh does
                      // not, so divide the height to keep the frame on screen
                      height: `calc(100vh / ${uiScale})`,
                      width: "100%",
                      boxSizing: "border-box",
                      overflow: "hidden",
                      touchAction: "pan-y",
                      backgroundColor: tokens.bg,
                      zoom: String(uiScale),
                    }}
                  >
                    <TopBar
                      season={season}
                      daysUntilNext={daysUntilNext}
                      nextSeason={nextSeason}
                      holyDay={slot.holyDay ?? null}
                      windowControlStyle={resolvedWindowControlStyle}
                    />
                    <div
                      style={{
                        display: "flex",
                        flex: 1,
                        boxSizing: "border-box",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {isMobile ? (
                        <div
                          ref={drawerRef}
                          data-bcp-drawer
                          className="bcp-drawer"
                          style={{
                            // position rides a CSS variable the drag writes
                            // imperatively, so React never fights the gesture
                            transform:
                              "translate3d(var(--bcp-drawer-x, -100%), 0, 0)",
                            touchAction: "pan-y",
                            pointerEvents:
                              mobileOpen || draggingDrawer ? "auto" : "none",
                            ...styles.sidebarOverlay,
                          }}
                        >
                          <Sidebar
                            active={page}
                            onSelect={handlePageSelect}
                            onHide={hideSidebar}
                            onOpenModal={handleOpenModal}
                            detail={sidebarDetail}
                            dragging={draggingDrawer}
                            showLabels={toolbarLabels}
                          />
                          <Pressable
                            style={styles.edgeCloseHit}
                            onPress={hideSidebar}
                            accessibilityLabel="Hide sidebar"
                            accessibilityRole="button"
                          >
                            {({ hovered, pressed }) => (
                              <View
                                style={[
                                  styles.edgeClose,
                                  (hovered || pressed) &&
                                    styles.edgeCloseActive,
                                ]}
                              >
                                <PullChevron direction="left" />
                              </View>
                            )}
                          </Pressable>
                        </div>
                      ) : sidebarVisible ? (
                        <div
                          className="bcp-sidebar-in bcp-sidebar-in-left"
                          style={{
                            width: "25%",
                            minWidth: 200,
                            maxWidth: 340,
                            flexShrink: 0,
                          }}
                        >
                          <Sidebar
                            active={page}
                            onSelect={handlePageSelect}
                            onHide={hideSidebar}
                            onOpenModal={handleOpenModal}
                            detail={sidebarDetail}
                            dragging={draggingDrawer}
                            showLabels={toolbarLabels}
                          />
                        </div>
                      ) : null}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          boxSizing: "border-box",
                          overflow: "hidden",
                        }}
                      >
                        {auxRow}
                        <div
                          ref={scrollRef}
                          tabIndex={-1}
                          onScroll={handleScroll}
                          style={{
                            flex: 1,
                            boxSizing: "border-box",
                            outline: "none",
                            position: "relative",
                            overflowX: "hidden",
                            overflowY:
                              page === "calendar" ||
                              (isReferencePage(page) && !isMobile)
                                ? "hidden"
                                : "auto",
                            display: "flex",
                            flexDirection: "column",
                            touchAction: "pan-y",
                            alignItems:
                              page === "calendar" || isReferencePage(page)
                                ? "stretch"
                                : "center",
                          }}
                        >
                          <div
                            key={page}
                            style={{
                              boxSizing: "border-box",
                              width: "100%",
                              // on desktop the zoom keeps its reading measure so
                              // larger text doesn't collapse into a thin strip;
                              // mobile keeps reflow within the available width
                              maxWidth:
                                page === "today" || page === "lectionary"
                                  ? isMobile
                                    ? `${u(46 / fontScale)}rem`
                                    : "46rem"
                                  : "100%",
                              padding:
                                page === "today" || page === "lectionary"
                                  ? isMobile
                                    ? `clamp(${u(1 / fontScale)}rem, ${u(4 / fontScale)}vw, ${u(32 / fontScale)}px) clamp(${u(1 / fontScale)}rem, ${u(5 / fontScale)}vw, ${u(40 / fontScale)}px)`
                                    : "clamp(1rem, 4vw, 32px) clamp(1rem, 5vw, 40px)"
                                  : "0",
                              height:
                                page === "calendar" ||
                                (isReferencePage(page) && !isMobile)
                                  ? "100%"
                                  : undefined,
                              zoom:
                                page !== "calendar" &&
                                !(isReferencePage(page) && !isMobile) &&
                                fontScale !== 1
                                  ? String(fontScale)
                                  : undefined,
                            }}
                          >
                            {content}
                          </div>
                        </div>

                        <ScriptureLoadingBar />
                        <UpdateBanner />
                        <StatusBar
                          season={season}
                          seasonColor={seasonColor}
                          slot={slot}
                          cycleLabel={cycleLabel}
                          officeName={
                            edition === "1662" && page === "today"
                              ? tab === "morning"
                                ? "Matins"
                                : tab === "evening"
                                  ? "Evensong"
                                  : (bcp1662TodayDoc?.officeName ??
                                    document.officeName)
                              : document.officeName
                          }
                          scrollPct={scrollPct}
                          reading={
                            isReferencePage(page)
                              ? reading
                              : page === "lectionary"
                                ? "Daily Readings"
                                : null
                          }
                        />
                      </div>
                      {isMobile && !mobileOpen ? (
                        <Pressable
                          style={styles.edgePullHit}
                          onPress={openSidebar}
                          accessibilityLabel="Show sidebar"
                          accessibilityRole="button"
                        >
                          {({ hovered, pressed }) => (
                            <View
                              style={[
                                styles.edgePull,
                                (hovered || pressed) && styles.edgePullActive,
                              ]}
                            >
                              <PullChevron direction="right" />
                            </View>
                          )}
                        </Pressable>
                      ) : null}
                    </div>
                  </div>
                  {/* the settings modal, palette, and hints stay outside the
                      zoom, so a large scale can never push its own controls
                      out of reach */}
                  {autoscroll ? (
                    <AutoscrollGlyph indicator={autoscroll} />
                  ) : null}
                  {modalContent}
                  <PaletteHost />
                  <HintLayer ref={hintsRef} />
                </SaintPopoverProvider>
              </PaletteProvider>
            </NavigationContext.Provider>
          </BibleProvider>
        </ReferenceProvider>
      </HistoryProvider>
    );
  }

  return (
    <HistoryProvider controller={historyController}>
      <ReferenceProvider
        onReadingChange={setReading}
        page={page}
        navKey={navKey}
      >
        <BibleProvider page={page} navKey={navKey}>
          <NavigationContext.Provider value={{ navigateTo: handleNavigateTo }}>
            <PaletteProvider>
              <SaintPopoverProvider>
                <View style={styles.shell} {...swipeHandlers}>
                  <TopBar
                    season={season}
                    daysUntilNext={daysUntilNext}
                    nextSeason={nextSeason}
                    holyDay={slot.holyDay ?? null}
                    windowControlStyle={resolvedWindowControlStyle}
                  />
                  <View style={styles.body}>
                    {sidebarVisible ? (
                      <View
                        style={isMobile ? styles.sidebarOverlay : undefined}
                      >
                        <Sidebar
                          active={page}
                          onSelect={handlePageSelect}
                          onHide={hideSidebar}
                          onOpenModal={handleOpenModal}
                          detail={sidebarDetail}
                          dragging={draggingDrawer}
                          showLabels={toolbarLabels}
                        />
                      </View>
                    ) : null}
                    <View style={styles.mainCol}>
                      {auxRow}
                      <View
                        style={[
                          styles.content,
                          isReferencePage(page) && styles.contentWide,
                          { transform: [{ scale: fontScale }] },
                        ]}
                      >
                        {content}
                      </View>
                    </View>
                    {isMobile && sidebarVisible ? (
                      <Pressable
                        style={styles.backdrop}
                        onPress={() => setMobileOpen(false)}
                        accessibilityLabel="Close navigation"
                        accessibilityRole="button"
                      />
                    ) : null}
                  </View>
                  {autoscroll ? (
                    <AutoscrollGlyph indicator={autoscroll} />
                  ) : null}
                  {modalContent}
                  <PaletteHost />
                </View>
              </SaintPopoverProvider>
            </PaletteProvider>
          </NavigationContext.Provider>
        </BibleProvider>
      </ReferenceProvider>
    </HistoryProvider>
  );
}

const shellStyles = defineThemedStyles({
  shell: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    position: "relative",
  },
  mainCol: {
    flex: 1,
  },
  auxStrip: {
    height: 30,
    userSelect: "none",
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    backgroundColor: "var(--bg)",
  },
  // the visible chip stays 24px; this frame absorbs the strip's padding and the
  // gap after it, so the touch target grows without shifting neighbors or
  // taking row space
  auxShowHit: {
    width: 34,
    marginLeft: -6,
    marginRight: -4,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  auxShowBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--surface)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border)",
  },
  auxShowBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  // a small thumb in the left margin keeps the closed drawer reachable by tap
  // or edge swipe; it stays 14px wide to clear the text gutter, while the
  // invisible 26px frame gives the browser a finger-sized target
  edgePullHit: {
    position: "absolute",
    left: 0,
    top: "50%",
    marginTop: -32,
    width: 26,
    height: 64,
    zIndex: 25,
    alignItems: "flex-start",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    // leave vertical reading scroll to the page; only horizontal drags belong
    // to the drawer
    touchAction: "pan-y",
  },
  edgePull: {
    width: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--surface)",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "var(--border)",
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  edgePullActive: {
    backgroundColor: "var(--control-hover)",
    borderColor: "var(--accent)",
  },
  // the same thumb mirrored on the drawer's trailing edge, so the handle reads
  // as the edge of a sliding pane rather than a list footer
  edgeCloseHit: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -32,
    width: 26,
    height: 64,
    zIndex: 25,
    alignItems: "flex-end",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    touchAction: "pan-y",
  },
  edgeClose: {
    width: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--surface)",
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "var(--border)",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  edgeCloseActive: {
    backgroundColor: "var(--control-hover)",
    borderColor: "var(--accent)",
  },
  sidebarOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    zIndex: 30,
  },
  backdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    cursor: "pointer",
  },
  content: {
    flex: 1,
    maxWidth: 640,
    alignSelf: "center",
    padding: 24,
  },
  contentWide: {
    maxWidth: "100%",
    alignSelf: "stretch",
    padding: 0,
  },
  // sized down so it reads as a tag beside the display-face wordmark
  changelogVersion: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 15,
    color: "var(--text-secondary)",
  },
});
