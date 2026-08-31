import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { SaintPopoverProvider } from "../../components/office/SaintPopover";
import {
  AppModal,
  dismissEscapeConsumers,
} from "../../components/shell/AppModal";
import { Chevron } from "../../components/shell/Chevron";
import { HelpScreen } from "../../components/shell/HelpScreen";
import type { ModalType, PageId } from "../../components/shell/Sidebar";
import { Sidebar } from "../../components/shell/Sidebar";
import { useDrawerSwipe } from "../../components/shell/useDrawerSwipe";
import { BibleProvider, setBiblePendingRef } from "../../context/BibleContext";
import {
  type NavigateToRef,
  NavigationContext,
} from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import {
  addDays,
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
  CanticlesBar,
  CanticlesScreen,
  CollectsBar,
  CollectsScreen,
  OfficesBar,
  OfficesScreen,
  ProverbsBar,
  ProverbsScreen,
  PsalmsBar,
  PsalmsScreen,
  ReferenceProvider,
  SaintsBar,
  SaintsScreen,
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
    p === "saints" ||
    p === "proverbs" ||
    p === "canticles" ||
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
  // increments on every navigation (including re-entering the same
  // page), so reference searches reset each time a page is entered
  const [navKey, setNavKey] = useState(0);
  const [modal, setModal] = useState<ModalType | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [scrollPct, setScrollPct] = useState(0);

  const [isMobile, setIsMobile] = useState(() => {
    if (Platform.OS !== "web") return true;
    return window.matchMedia("(max-width: 740px)").matches;
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
    const mq = window.matchMedia("(max-width: 740px)");
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
    setNavKey((k) => k + 1);
    setReading(null);
    if (isMobile) setMobileOpen(false);
    scrollToTop();
  };

  const handleNavigateTo = useCallback(
    (target: NavigateToRef | PageId) => {
      const setPageAndClean = (p: PageId) => {
        setPage(p);
        setNavKey((k) => k + 1);
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

  // global keyboard shortcuts (GitHub-style). attached in the capture phase
  // so handled keys are stopped before browser extensions like Vimium can
  // grab them; unhandled keys pass through untouched.
  useEffect(() => {
    if (!IS_WEB) return;
    let goPending: string | null = null;
    let goTimer: ReturnType<typeof setTimeout> | null = null;
    const GO_MAP: Record<string, PageId> = {
      t: "today",
      c: "calendar",
      p: "psalms",
      o: "offices",
      b: "old-testament",
      n: "new-testament",
      s: "saints",
      w: "proverbs",
      a: "canticles",
    };
    const isEditable = (el: EventTarget | null): boolean => {
      // SAFETY: DOM keydown targets are Elements or text nodes; a missing
      // tagName is treated as non-editable by the guard below
      const t = el as HTMLElement | null;
      if (!t?.tagName) return false;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      return t.isContentEditable === true;
    };
    const scrollActive = (dy: number) => {
      const el = scrollRef.current;
      if (el && el.scrollHeight > el.clientHeight) {
        el.scrollTop += dy;
        return;
      }
      const detail = window.document.querySelector("[data-split-detail]");
      if (detail) {
        // SAFETY: the split detail pane is a real DOM scroller, so it is an
        // HTMLElement with a scrollTop we can read and write
        (detail as HTMLElement).scrollTop += dy;
      }
    };
    const stepDay = (delta: number) => {
      setDate((d) => addDays(d, delta));
      handleNavigateTo("today");
    };
    const clearGo = () => {
      if (goTimer) clearTimeout(goTimer);
      goPending = null;
      goTimer = null;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      if (modal) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          setModal(null);
        }
        return;
      }
      if (goPending !== null) {
        const page = GO_MAP[e.key.toLowerCase()];
        clearGo();
        if (page) {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleNavigateTo(page);
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key;
      switch (key) {
        case "?":
        case "/":
          if (e.shiftKey) {
            e.preventDefault();
            e.stopImmediatePropagation();
            setModal("help");
          }
          clearGo();
          return;
        case "Escape":
          e.preventDefault();
          // any open modal (AppModal-registered, e.g. the saint lookup)
          // closes first; the go-chord state clears either way
          dismissEscapeConsumers();
          e.stopImmediatePropagation();
          clearGo();
          return;
        case "g":
          e.preventDefault();
          e.stopImmediatePropagation();
          clearGo();
          goPending = "";
          goTimer = setTimeout(clearGo, 900);
          return;
        case "n":
          e.preventDefault();
          e.stopImmediatePropagation();
          stepDay(1);
          return;
        case "p":
          e.preventDefault();
          e.stopImmediatePropagation();
          stepDay(-1);
          return;
        case "j":
        case "ArrowDown":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActive(360);
          return;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActive(-360);
          return;
        case "Home":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollToTop();
          return;
        case "End":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActive(Number.MAX_SAFE_INTEGER);
          return;
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (goTimer) clearTimeout(goTimer);
    };
  }, [modal, handleNavigateTo, scrollToTop]);

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
      case "canticles":
        return <CanticlesBar leading={sidebarShowButton} isMobile={isMobile} />;
      case "collects":
        return <CollectsBar leading={sidebarShowButton} isMobile={isMobile} />;
      case "offices":
        return <OfficesBar leading={sidebarShowButton} isMobile={isMobile} />;
      case "saints":
        return <SaintsBar leading={sidebarShowButton} isMobile={isMobile} />;
      case "proverbs":
        return <ProverbsBar leading={sidebarShowButton} isMobile={isMobile} />;
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
        return (
          <PsalmsScreen
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
          <OfficesScreen isMobile={isMobile} onScrollProgress={reportScroll} />
        );
      case "saints":
        return (
          <SaintsScreen
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
  };

  const auxRow = getAuxRow();
  const content = getContent();

  const closeModal = () => setModal(null);

  const modalContent = (() => {
    switch (modal) {
      case "settings":
        return (
          <AppModal title="Settings" onClose={closeModal} width={760}>
            <SettingsScreen
              showWindowControls={IS_TAURI && !IS_MACOS_TAURI}
              windowControls={windowControls}
              onWindowControlsChange={setWindowControls}
            />
          </AppModal>
        );
      case "install":
        return (
          <AppModal title="Install" onClose={closeModal} width={760}>
            <InstallScreen />
          </AppModal>
        );
      case "about":
        return (
          <AppModal title="About" onClose={closeModal} width={760}>
            <AboutScreen />
          </AppModal>
        );
      case "help":
        return (
          <AppModal title="Help & Shortcuts" onClose={closeModal} width={760}>
            <HelpScreen />
          </AppModal>
        );
      default:
        return null;
    }
  })();

  if (IS_WEB) {
    return (
      <ReferenceProvider
        onReadingChange={setReading}
        page={page}
        navKey={navKey}
      >
        <BibleProvider
          page={page}
          onReadingChange={setReading}
          onChapterChange={scrollToTop}
        >
          <NavigationContext.Provider value={{ navigateTo: handleNavigateTo }}>
            <SaintPopoverProvider>
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
                        onOpenModal={setModal}
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
                          maxWidth: page === "today" ? "46rem" : "100%",
                          padding:
                            page === "today"
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
                {modalContent}
              </div>
            </SaintPopoverProvider>
          </NavigationContext.Provider>
        </BibleProvider>
      </ReferenceProvider>
    );
  }

  return (
    <ReferenceProvider onReadingChange={setReading} page={page} navKey={navKey}>
      <BibleProvider page={page}>
        <NavigationContext.Provider value={{ navigateTo: handleNavigateTo }}>
          <SaintPopoverProvider>
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
                      onOpenModal={setModal}
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
              {modalContent}
            </View>
          </SaintPopoverProvider>
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
    borderRadius: 4,
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
