import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Chevron } from "../../components/shell/Chevron";
import type { PageId } from "../../components/shell/Sidebar";
import { Sidebar } from "../../components/shell/Sidebar";
import { useTheme } from "../../context/ThemeContext";
import {
  colorFor,
  daysUntilNextSeason,
  resolve,
  seasonFor,
} from "../../lib/calendar";
import type { CalendarDate } from "../../lib/calendar/types";
import { composeOffice } from "../../lib/office";
import { DEFAULT_PREFS } from "../../lib/office/types";
import { CalendarScreen } from "../../screens/CalendarScreen";
import {
  OfficesScreen,
  ReferenceBar,
  ReferenceProvider,
} from "../../screens/OfficesScreen";
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

export function Shell() {
  const { resolved, fontScale } = useTheme();
  const [date, setDate] = useState<CalendarDate>(today);
  const [tab, setTab] = useState<TabId>(() =>
    officeForHour(new Date().getHours()),
  );
  const [page, setPage] = useState<PageId>("today");
  const [reading, setReading] = useState<string | null>(null);
  const [scrollPct, setScrollPct] = useState(0);

  const [sidebarVisible, setSidebarVisibleRaw] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarVisible") !== "false";
    }
    return true;
  });

  const setSidebarVisible = useCallback((v: boolean) => {
    setSidebarVisibleRaw(v);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarVisible", String(v));
    }
  }, []);

  const [isMobile, setIsMobile] = useState(() => {
    if (Platform.OS !== "web") return true;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setSidebarVisible(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setSidebarVisible]);
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

  const handlePageSelect = (p: PageId) => {
    setPage(p);
    setReading(null);
    if (isMobile) setSidebarVisible(false);
    scrollToTop();
  };

  // park keyboard focus on the scroller so native arrow/space
  // navigation works from first load without a click
  useEffect(() => {
    if (!IS_WEB) return;
    scrollRef.current?.focus({ preventScroll: true });
  }, []);

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = 0;
      el.focus({ preventScroll: true });
    }
    setScrollPct(0);
  };

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
      onPress={() => setSidebarVisible(true)}
      accessibilityLabel="Show sidebar"
      accessibilityRole="button"
    >
      <Chevron direction="right" size={7} />
    </Pressable>
  ) : null;

  // every page gets the auxiliary 30px row under the TopBar: the
  // page's own bar where one exists, otherwise a bare strip
  const auxRow =
    page === "offices" ? (
      <ReferenceBar leading={sidebarShowButton} />
    ) : page === "today" ? (
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
    ) : page === "settings" ? (
      <View style={styles.auxStrip}>{sidebarShowButton}</View>
    ) : null;

  const content = (() => {
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
      case "offices":
        return <OfficesScreen />;
      case "settings":
        return <SettingsScreen />;
    }
  })();

  if (IS_WEB) {
    return (
      <ReferenceProvider onReadingChange={setReading}>
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
              <div style={isMobile ? styles.sidebarOverlay : undefined}>
                <Sidebar
                  active={page}
                  onSelect={handlePageSelect}
                  onHide={() => setSidebarVisible(false)}
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
                /* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard-focusable for native arrow scrolling */
                tabIndex={0}
                style={{
                  flex: 1,
                  boxSizing: "border-box",
                  outline: "none",
                  overflowX: "hidden",
                  overflowY: page === "calendar" ? "hidden" : "auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: page === "calendar" ? "stretch" : "center",
                }}
              >
                <div
                  style={{
                    // raw divs are content-box by default; without
                    // this the 100% width ignores padding and bleeds
                    boxSizing: "border-box",
                    // zoom scales the laid-out box, so pre-divide the
                    // width to keep the rendered size at exactly 100%;
                    // clamp to <=100% so scales under 1 can't overflow
                    width: `${Math.min(100, 100 / fontScale)}%`,
                    maxWidth:
                      page === "calendar"
                        ? "100%"
                        : `${(46 / fontScale).toFixed(4)}rem`,
                    padding:
                      page === "calendar"
                        ? "0"
                        : "clamp(1rem, 4vw, 32px) clamp(1rem, 5vw, 40px)",
                    height: page === "calendar" ? "100%" : undefined,
                    zoom: page !== "calendar" ? String(fontScale) : undefined,
                  }}
                >
                  {content}
                </div>
              </div>
              <StatusBar
                season={season}
                seasonColor={seasonColor}
                slot={slot}
                officeName={document.officeName}
                scrollPct={scrollPct}
                reading={page === "offices" ? reading : null}
              />
            </div>
          </div>
        </div>
      </ReferenceProvider>
    );
  }

  return (
    <ReferenceProvider onReadingChange={setReading}>
      <View style={styles.shell}>
        <TopBar
          season={season}
          daysUntilNext={daysUntilNext}
          nextSeason={nextSeason}
        />
        <View style={styles.body}>
          {sidebarVisible ? (
            <View style={isMobile ? styles.sidebarOverlay : undefined}>
              <Sidebar
                active={page}
                onSelect={handlePageSelect}
                onHide={() => setSidebarVisible(false)}
              />
            </View>
          ) : null}
          <View style={styles.mainCol}>
            {auxRow}
            <View
              style={[styles.content, { transform: [{ scale: fontScale }] }]}
            >
              {content}
            </View>
            <StatusBar
              season={season}
              seasonColor={seasonColor}
              slot={slot}
              officeName={document.officeName}
              scrollPct={scrollPct}
              reading={page === "offices" ? reading : null}
            />
          </View>
        </View>
      </View>
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
    backgroundColor: "var(--border, #d2cbbf)",
  },
  sidebarOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 30,
  },
  content: {
    flex: 1,
    maxWidth: 640,
    alignSelf: "center",
    padding: 24,
  },
});
