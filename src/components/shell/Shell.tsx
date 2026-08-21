import { useCallback, useRef, useState } from "react";
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
  const [scrollPct, setScrollPct] = useState(0);
  const [reading, setReading] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisibleRaw] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarVisible") !== "false";
    }
    return true;
  });

  const setSidebarVisible = (v: boolean) => {
    setSidebarVisibleRaw(v);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarVisible", String(v));
    }
  };
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
    scrollToTop();
  };

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
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

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollPct(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
  }, []);

  const handleTabChange = (t: TabId) => {
    setTab(t);
    scrollToTop();
  };

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
          <CalendarScreen date={date} onSelectDate={handleCalendarSelect} />
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
            backgroundColor: resolved === "dark" ? "#1b191a" : "#e0dbd0",
            userSelect: "none",
            WebkitUserSelect: "none",
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
              overflow: "hidden",
              position: "relative",
            }}
          >
            {sidebarVisible ? (
              <Sidebar
                active={page}
                onSelect={handlePageSelect}
                onHide={() => setSidebarVisible(false)}
              />
            ) : (
              <Pressable
                style={({ hovered }) => [
                  styles.sidebarShowBtn,
                  hovered && styles.sidebarShowBtnHover,
                ]}
                onPress={() => setSidebarVisible(true)}
                accessibilityLabel="Show sidebar"
                accessibilityRole="button"
              >
                <Chevron direction="right" size={6} />
              </Pressable>
            )}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {page === "offices" ? <ReferenceBar /> : null}
              {page === "offices" ? <ReferenceBar /> : null}
              {page === "today" ? (
                <OfficeTabs
                  active={tab}
                  onSelect={handleTabChange}
                  showRubrics={showRubrics}
                  onToggleRubrics={() => setShowRubrics((v) => !v)}
                  showSpeakers={showSpeakers}
                  onToggleSpeakers={() => setShowSpeakers((v) => !v)}
                  devotions={devotions}
                  onToggleDevotions={() => setDevotions(!devotions)}
                />
              ) : null}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                  flex: 1,
                  overflowY: page === "calendar" ? "hidden" : "auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: page === "calendar" ? "stretch" : "center",
                  userSelect: "auto",
                  WebkitUserSelect: "auto",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: page === "calendar" ? "100%" : "46rem",
                    padding: page === "calendar" ? "0" : "32px 40px",
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
                reading={page === "offices" ? reading : null}
                scrollPct={scrollPct}
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
            <Sidebar
              active={page}
              onSelect={handlePageSelect}
              onHide={() => setSidebarVisible(false)}
            />
          ) : null}
          <View style={styles.mainCol}>
            {page === "today" ? (
              <OfficeTabs
                active={tab}
                onSelect={handleTabChange}
                showRubrics={showRubrics}
                onToggleRubrics={() => setShowRubrics((v) => !v)}
                showSpeakers={showSpeakers}
                onToggleSpeakers={() => setShowSpeakers((v) => !v)}
                devotions={devotions}
                onToggleDevotions={() => setDevotions(!devotions)}
              />
            ) : null}
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
              reading={page === "offices" ? reading : null}
              scrollPct={scrollPct}
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
  },
  mainCol: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: 640,
    alignSelf: "center",
    padding: 24,
  },
  sidebarShowBtn: {
    position: "absolute",
    left: 6,
    top: 80,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    zIndex: 10,
  },
  sidebarShowBtnHover: {
    backgroundColor: "var(--border, #d2cbbf)",
  },
});
