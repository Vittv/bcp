import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SaintPopoverProvider } from "../../components/office/SaintPopover";
import {
  AppModal,
  dismissEscapeConsumers,
} from "../../components/shell/AppModal";
import { Chevron } from "../../components/shell/Chevron";
import { HelpScreen } from "../../components/shell/HelpScreen";
import { type HintHandle, HintLayer } from "../../components/shell/HintLayer";
import type { ModalType, PageId } from "../../components/shell/Sidebar";
import { Sidebar } from "../../components/shell/Sidebar";
import {
  type AutoscrollIndicator,
  useAutoscroll,
} from "../../components/shell/useAutoscroll";
import { useDrawerSwipe } from "../../components/shell/useDrawerSwipe";
import { BibleProvider, setBiblePendingRef } from "../../context/BibleContext";
import {
  HistoryProvider,
  type HistorySnapshot,
} from "../../context/HistoryContext";
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
  IS_DESKTOP,
  IS_MACOS,
  IS_WINDOWS,
  loadWindowControls,
  saveWindowControls,
} from "../../lib/desktop";
import { activeScrollTarget } from "../../lib/input/vim";
import {
  createHistoryController,
  type HistoryController,
} from "../../lib/navigation/history";
import { composeOffice } from "../../lib/office";
import { DEFAULT_PREFS } from "../../lib/office/types";
import { AboutScreen } from "../../screens/AboutScreen";
import { BibleBar, BibleReaderScreen } from "../../screens/BibleReaderScreen";
import { CalendarScreen } from "../../screens/CalendarScreen";
import { InstallScreen } from "../../screens/InstallScreen";
import {
  LectionaryBar,
  LectionaryScreen,
} from "../../screens/LectionaryScreen";
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

// the scroll-click autoscroll glyph, drawn to match the browser's own: a
// white circle with a black border, two chevrons (up and down), and a dot
// in the center. parked where the middle-click landed.
function AutoscrollGlyph({ indicator }: { indicator: AutoscrollIndicator }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.autoscrollIndicator,
        { left: indicator.x, top: indicator.y },
      ]}
    >
      <svg
        width={40}
        height={40}
        viewBox="0 0 40 40"
        role="img"
        aria-label="Autoscroll"
      >
        <circle
          cx="20"
          cy="20"
          r="18.5"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="1.5"
        />
        <path
          d="M11 15 L20 6 L29 15"
          fill="none"
          stroke="#000000"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="2.5" fill="#000000" />
        <path
          d="M11 25 L20 34 L29 25"
          fill="none"
          stroke="#000000"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </View>
  );
}

export function Shell() {
  const { resolved, fontScale } = useTheme();

  useEffect(() => {
    if (Platform.OS === "web") ensureSidebarAnimStyle();
  }, []);

  const [date, setDate] = useState<CalendarDate>(today);
  // the lectionary keeps its own date, independent of the office date shown
  // on Today; stepping its prev/next/today never touches the global date
  const [lectionaryDate, setLectionaryDate] = useState<CalendarDate>(today);
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

  // mobile drawer gestures: any right-swipe opens the drawer, a left-swipe
  // (over content or the drawer) closes it. a modal takes precedence over
  // the sheltered drawer, so a swipe over modal content never opens it.
  const swipeHandlers = useDrawerSwipe({
    enabled: isMobile && modal === null,
    open: mobileOpen,
    onOpen: () => setMobileOpen(true),
    onClose: () => setMobileOpen(false),
  });

  // Android hardware back hides the mobile drawer before the OS ever gets a
  // chance to leave the app; modals claim their own handler (registered
  // later, so LIFO dispatch runs theirs first) and nothing here runs on the
  // desktop/web builds
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (mobileOpen) {
        setMobileOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [mobileOpen]);

  // scroll-click (middle button) autoscroll, Linux and macOS desktop only:
  // their webviews (WebKitGTK, WKWebView) have no native gesture, while
  // Windows WebView2 and the plain web build keep theirs
  const autoscroll = useAutoscroll(IS_DESKTOP && !IS_WINDOWS);

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
  const hintsRef = useRef<HintHandle>(null);

  // browser history integration: one controller for the whole shell. only
  // web has a history to drive; native builds get a null (no-op) provider.
  const [historyController] =
    useState<HistoryController<HistorySnapshot> | null>(() => {
      if (Platform.OS !== "web") return null;
      return createHistoryController<HistorySnapshot>({
        addEventListener: (type, cb) => window.addEventListener(type, cb),
        removeEventListener: (type, cb) => window.removeEventListener(type, cb),
        history: window.history,
        seedUrl: window.location.href,
      });
    });

  // the controller's getters must read the latest committed value, not a
  // closure captured at registration time; these refs update each render
  const pageRef = useRef(page);
  pageRef.current = page;
  const dateRef = useRef(date);
  dateRef.current = date;
  const tabRef = useRef(tab);
  tabRef.current = tab;

  // web only: the JSON of the current top-of-history entry when it is the
  // drawer's own record (see the record effect below). kept so re-opening
  // the drawer without navigating in between never stacks another entry.
  const drawerRecord = useRef<string | null>(null);

  // web only: reify the drawer-opening as its own history step, so the
  // system back button has an entry to pop even at the app root (where back
  // would otherwise leave the PWA instead of hiding the drawer). the
  // existing onRestored handler closes the drawer as soon as that entry is
  // popped, and resets drawerRecord so a later open records again.
  useEffect(() => {
    if (!historyController || !mobileOpen) return;
    const top = JSON.stringify(window.history.state ?? null) ?? null;
    if (top === drawerRecord.current) return;
    historyController.record();
    drawerRecord.current = JSON.stringify(window.history.state ?? null) ?? null;
  }, [mobileOpen, historyController]);

  // whenever the drawer closes while its recorded step is still the top of
  // history, consume that step via history.back() so Back behaves exactly as
  // if the drawer never opened. a dismiss (swipe, backdrop, hide button) only
  // hides the drawer, leaving its step behind the phantom entry: popping it
  // here keeps Back from stopping on a phantom drawer step. a system Back
  // that already popped the step clears drawerRecord in onRestored first, so
  // this never double-consumes.
  useEffect(() => {
    if (mobileOpen) return;
    if (!historyController || !drawerRecord.current) return;
    const top = JSON.stringify(window.history.state ?? null) ?? null;
    if (top !== drawerRecord.current) return;
    drawerRecord.current = null;
    window.history.back();
  }, [mobileOpen, historyController]);

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

  useEffect(() => {
    if (!historyController) return;
    historyController.start();
    return () => historyController.stop();
  }, [historyController]);

  useEffect(() => {
    if (!historyController) return;
    const offPage = historyController.register(
      "page",
      () => pageRef.current,
      (v) => setPage(v),
    );
    const offDate = historyController.register(
      "date",
      () => dateRef.current,
      (v) => setDate(v),
    );
    const offTab = historyController.register(
      "tab",
      () => tabRef.current,
      (v) => setTab(v),
    );
    const offRestored = historyController.onRestored(() => {
      // a history navigation must never leave transient chrome open over a
      // different page: the mobile drawer closes, and any modal and office
      // reading clear. a pop that undoes the drawer's own recorded step
      // restores the exact page the drawer opened on, so the extra cleanup
      // below is harmless there
      drawerRecord.current = null;
      setMobileOpen(false);
      setModal(null);
      setReading(null);
      scrollToTop();
    });
    return () => {
      offPage();
      offDate();
      offTab();
      offRestored();
    };
  }, [historyController, scrollToTop]);

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
    [historyController, isMobile, scrollToTop],
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
        const meta = getKjvBookMeta(target.bookAbbrev);
        const page: PageId =
          meta?.testament === "NT" ? "new-testament" : "old-testament";
        setBiblePendingRef({
          abbrev: target.bookAbbrev,
          chapter: target.chapter,
        });
        // the snapshot carries the exact ref too, so Back/Forward restore
        // the chapter even though it is applied through the pending-ref path
        goToPage(page, {
          bible: { abbrev: target.bookAbbrev, chapter: target.chapter },
        });
      } else {
        goToPage(target.page);
      }
    },
    [goToPage],
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
      l: "lectionary",
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
    // on reference split pages the right-hand picker owns j/k while it has
    // focus; content (detail) owns them otherwise. lets h/l move between the
    // two panes and keeps each pane's j/k rolling its own scroller/cursor.
    const listHasFocus = (): boolean => {
      // SAFETY: activeElement is always an Element; closest exists on all
      // Elements, so the cast is safe for DOM elements queried here
      const a = window.document.activeElement as HTMLElement | null;
      return !!a?.closest?.("[data-split-list]");
    };
    const focusReferencePane = (list: boolean) => {
      // SAFETY: these are driven by the SplitPane DOM, which always has the
      // detail pane (data-split-detail) and list pane (data-split-list)
      const node = window.document.querySelector(
        list ? "[data-split-list]" : "[data-split-detail]",
      ) as HTMLElement | null;
      node?.focus({ preventScroll: false });
    };
    // scroll the currently-focused scroller by a fraction of its height. a
    // negative factor scrolls up. j/k and d/u share this, differ only in step.
    const scrollByFraction = (factor: number) => {
      const el = activeScrollTarget(scrollRef.current);
      if (!el) return;
      // sign-preserving step: never stall at 0, and never flip direction
      const raw = Math.round(el.clientHeight * factor);
      const top = raw === 0 ? (factor > 0 ? 1 : -1) : raw;
      el.scrollBy({ top, behavior: "auto" });
    };
    const scrollActiveTop = () => {
      const el = activeScrollTarget(scrollRef.current);
      if (el) el.scrollTop = 0;
    };
    const scrollActiveBottom = () => {
      const el = activeScrollTarget(scrollRef.current);
      if (el) el.scrollTop = el.scrollHeight;
    };
    const stepDay = (delta: number) => {
      // on the lectionary, n/p steps its own date without touching the
      // office date; everywhere else n/p steps the office date and jumps
      // to Today
      if (page === "lectionary") {
        setLectionaryDate((d) => addDays(d, delta));
        return;
      }
      const next = addDays(date, delta);
      setDate(next);
      goToPage("today", { date: next });
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
      // while hint mode is open every key drives the hint layer
      const hint = hintsRef.current;
      if (hint?.isActive()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        hint.handleKey(e);
        return;
      }
      if (goPending !== null) {
        const k = e.key.toLowerCase();
        if (k === "g") {
          e.preventDefault();
          e.stopImmediatePropagation();
          clearGo();
          scrollActiveTop();
          return;
        }
        const page = GO_MAP[k];
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
          // on a desktop reference page the picker owns j/k while its list
          // has focus (the index hooks move the row cursor); once focus is
          // on the content pane, j/k scroll that pane instead
          if (isReferencePage(page) && !isMobile && listHasFocus()) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollByFraction(0.14);
          return;
        case "k":
          if (isReferencePage(page) && !isMobile && listHasFocus()) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollByFraction(-0.14);
          return;
        case "h":
          // on a desktop reference split page h/l swap focus between the
          // content pane and the right-hand picker, so j/k/d/u/gg/G follow
          // whichever pane is active
          if (isReferencePage(page) && !isMobile) {
            e.preventDefault();
            e.stopImmediatePropagation();
            focusReferencePane(false);
            return;
          }
          return;
        case "l":
          if (isReferencePage(page) && !isMobile) {
            e.preventDefault();
            e.stopImmediatePropagation();
            focusReferencePane(true);
            return;
          }
          return;
        case "d":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollByFraction(0.5);
          return;
        case "u":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollByFraction(-0.5);
          return;
        case "G":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActiveBottom();
          return;
        case "f":
          e.preventDefault();
          e.stopImmediatePropagation();
          clearGo();
          hintsRef.current?.start();
          return;
        case "Home":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActiveTop();
          return;
        case "End":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActiveBottom();
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
  }, [modal, handleNavigateTo, page, date, goToPage, isMobile]);

  const document = composeOffice(
    date,
    devotions ? DEVOTIONS[tab] : OFFICES[tab],
    {
      ...DEFAULT_PREFS,
      personalMode: false,
      showRubrics,
    },
  );
  // the app's season context (top bar and status bar) always reflects the
  // real current date, never a date a page happened to be scrolled to; only
  // the Today office body (`document` above) follows the stepped office date
  const season = seasonFor(today());
  const seasonColor = colorFor(today());
  const slot = resolve(today());
  const { days: daysUntilNext, label: nextSeason } = daysUntilNextSeason(
    today(),
  );

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
              showWindowControls={IS_DESKTOP && !IS_MACOS}
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
      <HistoryProvider controller={historyController}>
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
            <NavigationContext.Provider
              value={{ navigateTo: handleNavigateTo }}
            >
              <SaintPopoverProvider>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh",
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    touchAction: "pan-y",
                    backgroundColor:
                      resolved === "dark" ? "#1b191a" : "#e0dbd0",
                  }}
                >
                  <TopBar
                    season={season}
                    daysUntilNext={daysUntilNext}
                    nextSeason={nextSeason}
                    holyDay={slot.holyDay ?? null}
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
                          touchAction: "pan-y",
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
                          style={{
                            boxSizing: "border-box",
                            width: "100%",
                            maxWidth:
                              page === "today" || page === "lectionary"
                                ? "46rem"
                                : "100%",
                            padding:
                              page === "today" || page === "lectionary"
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
                            style={{ ...styles.backdrop, touchAction: "pan-y" }}
                          />
                        ) : null}
                      </div>

                      <StatusBar
                        season={season}
                        seasonColor={seasonColor}
                        slot={slot}
                        officeName={document.officeName}
                        scrollPct={scrollPct}
                        reading={
                          isReferencePage(page)
                            ? reading
                            : page === "lectionary"
                              ? "Daily Readings"
                              : null
                        }
                        compact={compactBars}
                      />
                    </div>
                  </div>
                  {autoscroll ? (
                    <AutoscrollGlyph indicator={autoscroll} />
                  ) : null}
                  {modalContent}
                  <HintLayer ref={hintsRef} />
                </div>
              </SaintPopoverProvider>
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
        <BibleProvider page={page}>
          <NavigationContext.Provider value={{ navigateTo: handleNavigateTo }}>
            <SaintPopoverProvider>
              <View style={styles.shell} {...swipeHandlers}>
                <TopBar
                  season={season}
                  daysUntilNext={daysUntilNext}
                  nextSeason={nextSeason}
                  holyDay={slot.holyDay ?? null}
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
                  {isMobile && sidebarVisible ? (
                    <Pressable
                      style={styles.backdrop}
                      onPress={() => setMobileOpen(false)}
                      accessibilityLabel="Close navigation"
                      accessibilityRole="button"
                    />
                  ) : null}
                </View>
                {autoscroll ? <AutoscrollGlyph indicator={autoscroll} /> : null}
                {modalContent}
              </View>
            </SaintPopoverProvider>
          </NavigationContext.Provider>
        </BibleProvider>
      </ReferenceProvider>
    </HistoryProvider>
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
  autoscrollIndicator: {
    position: "absolute",
    zIndex: 100,
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
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
