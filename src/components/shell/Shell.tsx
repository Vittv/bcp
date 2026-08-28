import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Chevron } from "../../components/shell/Chevron";
import type { PageId } from "../../components/shell/Sidebar";
import { Sidebar } from "../../components/shell/Sidebar";
import { useDrawerSwipe } from "../../components/shell/useDrawerSwipe";
import { BibleProvider, setBiblePendingRef } from "../../context/BibleContext";
import {
  type NavigateToRef,
  NavigationContext,
} from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import {
  colorFor,
  daysUntilNextSeason,
  resolve,
  seasonFor,
} from "../../lib/calendar";
import type { CalendarDate } from "../../lib/calendar/types";
import { getKjvBookMeta } from "../../lib/content/kjv";
import {
  IS_MACOS_TAURI,
  IS_TAURI,
  loadWindowControls,
  saveWindowControls,
} from "../../lib/desktop";
import { composeOffice } from "../../lib/office";
import { DEFAULT_PREFS } from "../../lib/office/types";
import { AboutScreen } from "../../screens/AboutScreen";
import { BibleBar, BibleReaderScreen } from "../../screens/BibleReaderScreen";
import { CalendarScreen } from "../../screens/CalendarScreen";
import { InstallScreen } from "../../screens/InstallScreen";
import {
  CollectsBar,
  CollectsScreen,
  OfficesBar,
  OfficesScreen,
  PsalmsBar,
  PsalmsScreen,
  ReferenceProvider,
} from "../../screens/reference";
import { SettingsScreen } from "../../screens/SettingsScreen";
import { TodayScreen } from "../../screens/TodayScreen";
import { DEVOTIONS, OFFICES, OfficeTabs } from "./OfficeTabs";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";

type TabId = "morning" | "noonday" | "evening" | "compline";

function officeForHour(hour: number): TabId {
  if (hour < 12) return "morning";
  if (hour < 17) return "noonday";
  if (hour < 21) return "evening";
  return "compline";
}

function today(): CalendarDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

const IS_WEB = Platform.OS === "web";

// format a computed unit value without float noise
function u(n: number): string {
  return n.toFixed(4);
}

function isReferencePage(p: PageId): boolean {
  return (
    p === "psalms" ||
    p === "collects" ||
    p === "offices" ||
    p === "old-testament" ||
    p === "new-testament"
  );
}

const SIDEBAR_ANIM_STYLE_ID = "sidebar-anim-style";
// entrance animations: desktop fades-and-drifts in from the left edge,
// the mobile drawer slides in from off-screen for a native drawer feel
function ensureSidebarAnimStyle() {
  if (document.getElementById(SIDEBAR_ANIM_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = SIDEBAR_ANIM_STYLE_ID;
  el.textContent = `
@keyframes bcp-sidebar-in {
  from { opacity: 0; transform: var(--bcp-from, translateY(-8px)); }
}
:root {
  --bcp-drawer-width: min(84vw, 380px);
}
@keyframes bcp-drawer-in {
  from { transform: translateX(calc(-1 * var(--bcp-drawer-width))); }
}
.bcp-sidebar-in {
  animation: bcp-sidebar-in 150ms cubic-bezier(0.2, 0.9, 0.3, 1);
}
.bcp-drawer-in {
  animation: bcp-drawer-in 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.bcp-sidebar-in-left { --bcp-from: translateX(-8px); }
@media (prefers-reduced-motion: reduce) {
  .bcp-sidebar-in, .bcp-drawer-in { animation: none; }
}`;
  document.head.appendChild(el);
}

export function Shell() {
  const { resolved, fontScale } = useTheme();

  useEffect(() => {
    if (Platform.OS === "web") ensureSidebarAnimStyle();
  }, []);

  const [date, setDate] = useState<CalendarDate>(today);
  const [tab, setTab] = useState<TabId>(() =>
    officeForHour(new Date().getHours()),
  );
  const [page, setPage] = useState<PageId>("today");
  const [reading, setReading] = useState<string | null>(null);
  const [scrollPct, setScrollPct] = useState(0);

  const [isMobile, setIsMobile] = useState(() => {
    if (Platform.OS !== "web") return true;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  // Persistent sidebar visibility on desktop, deliberately toggled by the
  // user. The mobile drawer is a separate, transient state (mobileOpen) so a
  // shrink-to-mobile / auto-hide can never overwrite a deliberate desktop
  // choice.
  const [desktopVisible, setDesktopVisibleRaw] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sidebarVisible") !== "false";
  });
  const setDesktopVisible = useCallback((v: boolean) => {
    setDesktopVisibleRaw(v);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarVisible", String(v));
    }
  }, []);

  // Transient mobile drawer open/close state; deliberately not persisted.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Effective visibility: on mobile the drawer rides its transient state; on
  // desktop it follows the persisted preference. Resizing back to desktop
  // therefore restores the user's deliberate desktop choice, while a hidden
  // choice stays hidden.
  const sidebarVisible = isMobile ? mobileOpen : desktopVisible;

  const openSidebar = useCallback(() => {
    if (isMobile) setMobileOpen(true);
    else setDesktopVisible(true);
  }, [isMobile, setDesktopVisible]);

  const hideSidebar = useCallback(() => {
    if (isMobile) setMobileOpen(false);
    else setDesktopVisible(false);
  }, [isMobile, setDesktopVisible]);

  // windows-control buttons in the titlebar (desktop shell only)
  const [windowControls, setWindowControlsRaw] = useState(loadWindowControls);
  const setWindowControls = useCallback((v: boolean) => {
    setWindowControlsRaw(v);
    saveWindowControls(v);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      // entering mobile just resets the transient drawer (no persistence);
      // the derived sidebarVisible handles the desktop restore on the way up
      setIsMobile(e.matches);
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // mobile drawer gestures: edge-swipe to open, left-swipe to close
  useDrawerSwipe({
    enabled: IS_WEB && isMobile,
    open: mobileOpen,
    onOpen: () => setMobileOpen(true),
    onClose: () => setMobileOpen(false),
  });

  // narrow layout for the chrome bars themselves: they keep working
  // well below the sidebar's mobile breakpoint by dropping their
  // least informative segments
  const [compactBars, setCompactBars] = useState(() => {
    if (Platform.OS !== "web") return true;
    return window.matchMedia("(max-width: 560px)").matches;
  });

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const mq = window.matchMedia("(max-width: 560px)");
    const onChange = (e: MediaQueryListEvent) => {
      setCompactBars(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const [showRubrics, setShowRubrics] = useState(false);
  const [showSpeakers, setShowSpeakers] = useState(false);
  const [devotions, setDevotionsRaw] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("devotions") === "true";
    }
    return false;
  });

  const setDevotions = (v: boolean) => {
    setDevotionsRaw(v);
    if (typeof window !== "undefined") {
      localStorage.setItem("devotions", String(v));
    }
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCalendarSelect = (d: CalendarDate) => {
    setDate(d);
    scrollToTop();
  };

  const scrollToTop = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = 0;
      el.focus({ preventScroll: true });
    }
    setScrollPct(0);
    // also reset the SplitPane detail pane scroll (desktop reference pages)
    requestAnimationFrame(() => {
      // SAFETY: querySelector returns Element, we need HTMLElement for scrollTop
      const detail = window.document.querySelector(
        "[data-split-detail]",
      ) as HTMLElement | null;
      if (detail) detail.scrollTop = 0;
    });
  }, []);

  const handlePageSelect = (p: PageId) => {
    setPage(p);
    setReading(null);
    if (isMobile) setMobileOpen(false);
    scrollToTop();
  };

  const handleNavigateTo = useCallback(
    (target: NavigateToRef | PageId) => {
      const setPageAndClean = (p: PageId) => {
        setPage(p);
        setReading(null);
        if (isMobile) setMobileOpen(false);
        scrollToTop();
      };
      if (typeof target === "string") {
        setPageAndClean(target);
        return;
      }
      if (target.bookAbbrev && target.chapter) {
        const meta = getKjvBookMeta(target.bookAbbrev);
        const page: PageId =
          meta?.testament === "NT" ? "new-testament" : "old-testament";
        setBiblePendingRef({
          abbrev: target.bookAbbrev,
          chapter: target.chapter,
        });
        setPageAndClean(page);
      } else {
        setPageAndClean(target.page);
      }
    },
    [isMobile, scrollToTop],
  );

  // park keyboard focus on the scroller so native arrow/space
  // navigation works from first load without a click
  useEffect(() => {
    if (!IS_WEB) return;
    scrollRef.current?.focus({ preventScroll: true });
  }, []);

  const document = composeOffice(
    date,
    devotions ? DEVOTIONS[tab] : OFFICES[tab],
    {
      ...DEFAULT_PREFS,
      personalMode: false,
      showRubrics,
    },
  );
  const season = seasonFor(date);
  const seasonColor = colorFor(date);
  const slot = resolve(date);
  const { days: daysUntilNext, label: nextSeason } = daysUntilNextSeason(date);

  const scrollRafRef = useRef<number | null>(null);
  // shared sink for scroll progress: the outer document scroller reports
  // through handleScroll; the offices page's inner ScrollView reports
  // straight here, since its scrolling never touches the outer element
  const reportScroll = useCallback((pct: number) => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      setScrollPct(pct);
    });
  }, []);
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      setScrollPct(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
    });
  }, []);

  const handleTabChange = (t: TabId) => {
    setTab(t);
    scrollToTop();
  };

  const sidebarShowButton = !sidebarVisible ? (
    <Pressable
      style={({ hovered }) => [
        styles.auxShowBtn,
        hovered && styles.auxShowBtnHover,
      ]}
      onPress={openSidebar}
      accessibilityLabel="Show sidebar"
      accessibilityRole="button"
    >
      <Chevron direction="right" size={7} />
    </Pressable>
  ) : null;

  // every page gets the auxiliary 30px row under the TopBar: the
  // page's own bar where one exists, otherwise a bare strip
  const getAuxRow = () => {
    switch (page) {
      case "psalms":
        return <PsalmsBar leading={sidebarShowButton} isMobile={isMobile} />;
      case "collects":
        return <CollectsBar leading={sidebarShowButton} isMobile={isMobile} />;
      case "offices":
        return <OfficesBar leading={sidebarShowButton} isMobile={isMobile} />;
      case "old-testament":
      case "new-testament":
        return <BibleBar leading={sidebarShowButton} isMobile={isMobile} />;
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
          />
        );
      case "settings":
      case "about":
      case "install":
        return <View style={styles.auxStrip}>{sidebarShowButton}</View>;
      default:
        return null;
    }
  };

  const getContent = () => {
    switch (page) {
      case "today":
        return (
          <TodayScreen
            key={`${date.year}-${date.month}-${date.day}-${tab}-${devotions ? "dev" : "full"}`}
            date={date}
            tab={tab}
            onTabChange={handleTabChange}
            document={document}
            showRubrics={showRubrics}
            showSpeakers={showSpeakers}
          />
        );
      case "calendar":
        return (
          <CalendarScreen
            date={date}
            onSelectDate={handleCalendarSelect}
            leading={sidebarShowButton}
          />
        );
      case "psalms":
        return <PsalmsScreen isMobile={isMobile} fontScale={fontScale} />;
      case "collects":
        return <CollectsScreen isMobile={isMobile} fontScale={fontScale} />;
      case "offices":
        return (
          <OfficesScreen isMobile={isMobile} onScrollProgress={reportScroll} />
        );
      case "old-testament":
      case "new-testament":
        return (
          <BibleReaderScreen
            isMobile={isMobile}
            fontScale={fontScale}
            onScrollProgress={reportScroll}
          />
        );
      case "settings":
        return (
          <SettingsScreen
            showWindowControls={IS_TAURI && !IS_MACOS_TAURI}
            windowControls={windowControls}
            onWindowControlsChange={setWindowControls}
          />
        );
      case "about":
        return <AboutScreen />;
      case "install":
        return <InstallScreen />;
      default:
        return null;
    }
  };

  const auxRow = getAuxRow();
  const content = getContent();

  if (IS_WEB) {
    return (
      <ReferenceProvider onReadingChange={setReading} page={page}>
        <BibleProvider
          page={page}
          onReadingChange={setReading}
          onChapterChange={scrollToTop}
        >
          <NavigationContext.Provider value={{ navigateTo: handleNavigateTo }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                backgroundColor: resolved === "dark" ? "#1b191a" : "#e0dbd0",
              }}
            >
              <TopBar
                season={season}
                daysUntilNext={daysUntilNext}
                nextSeason={nextSeason}
                windowControls={windowControls}
                compact={compactBars}
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
                {sidebarVisible ? (
                  <div
                    className={
                      isMobile
                        ? "bcp-drawer-in"
                        : "bcp-sidebar-in bcp-sidebar-in-left"
                    }
                    style={{
                      width: isMobile ? "min(84vw, 380px)" : "25%",
                      minWidth: isMobile ? undefined : 200,
                      maxWidth: isMobile ? undefined : 340,
                      flexShrink: 0,
                      ...(isMobile ? styles.sidebarOverlay : undefined),
                    }}
                  >
                    <Sidebar
                      active={page}
                      onSelect={handlePageSelect}
                      onHide={hideSidebar}
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
                      alignItems:
                        page === "calendar" || isReferencePage(page)
                          ? "stretch"
                          : "center",
                    }}
                  >
                    <div
                      style={{
                        boxSizing: "border-box",
                        width: "100%",
                        maxWidth:
                          page === "today" ||
                          page === "settings" ||
                          page === "about" ||
                          page === "install"
                            ? "46rem"
                            : "100%",
                        padding:
                          page === "today" ||
                          page === "settings" ||
                          page === "about" ||
                          page === "install"
                            ? `clamp(${u(1 / fontScale)}rem, ${u(4 / fontScale)}vw, ${u(32 / fontScale)}px) clamp(${u(1 / fontScale)}rem, ${u(5 / fontScale)}vw, ${u(40 / fontScale)}px)`
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
                    {isMobile && sidebarVisible ? (
                      <div
                        onClick={() => setMobileOpen(false)}
                        aria-hidden="true"
                        style={styles.backdrop}
                      />
                    ) : null}
                  </div>

                  <StatusBar
                    season={season}
                    seasonColor={seasonColor}
                    slot={slot}
                    officeName={document.officeName}
                    scrollPct={scrollPct}
                    reading={isReferencePage(page) ? reading : null}
                    compact={compactBars}
                  />
                </div>
              </div>
            </div>
          </NavigationContext.Provider>
        </BibleProvider>
      </ReferenceProvider>
    );
  }

  return (
    <ReferenceProvider onReadingChange={setReading} page={page}>
      <BibleProvider page={page}>
        <NavigationContext.Provider value={{ navigateTo: handleNavigateTo }}>
          <View style={styles.shell}>
            <TopBar
              season={season}
              daysUntilNext={daysUntilNext}
              nextSeason={nextSeason}
              windowControls={windowControls}
            />
            <View style={styles.body}>
              {sidebarVisible ? (
                <View style={isMobile ? styles.sidebarOverlay : undefined}>
                  <Sidebar
                    active={page}
                    onSelect={handlePageSelect}
                    onHide={hideSidebar}
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
            </View>
          </View>
        </NavigationContext.Provider>
      </BibleProvider>
    </ReferenceProvider>
  );
}

const styles = StyleSheet.create({
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
    borderBottomColor: "var(--border, #d2cbbf)",
    backgroundColor: "var(--bg, #e0dbd0)",
  },
  auxShowBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--bg, #e0dbd0)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
  },
  auxShowBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  sidebarOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 30,
  },
  backdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: "rgba(20, 15, 15, 0.35)",
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
});
