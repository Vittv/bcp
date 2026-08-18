import { useCallback, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { PageId } from "../../components/shell/Sidebar";
import { Sidebar } from "../../components/shell/Sidebar";
import { useTheme } from "../../context/ThemeContext";
import { colorFor, resolve, seasonFor } from "../../lib/calendar";
import type { CalendarDate } from "../../lib/calendar/types";
import { composeOffice } from "../../lib/office";
import { DEFAULT_PREFS } from "../../lib/office/types";
import { CalendarScreen } from "../../screens/CalendarScreen";
import { OfficesScreen } from "../../screens/OfficesScreen";
import { SettingsScreen } from "../../screens/SettingsScreen";
import { TodayScreen } from "../../screens/TodayScreen";
import { OFFICES, OfficeTabs } from "./OfficeTabs";
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
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showRubrics, setShowRubrics] = useState(false);
  const [showSpeakers, setShowSpeakers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDateChange = (d: CalendarDate) => {
    setDate(d);
    setPage("today");
    scrollToTop();
  };

  const handleCalendarSelect = (d: CalendarDate) => {
    setDate(d);
    scrollToTop();
  };

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
    setScrollPct(0);
  };

  const document = composeOffice(date, OFFICES[tab], {
    ...DEFAULT_PREFS,
    personalMode: false,
    showRubrics,
  });
  const season = seasonFor(date);
  const seasonColor = colorFor(date);
  const slot = resolve(date);

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
            key={`${date.year}-${date.month}-${date.day}-${tab}`}
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
          date={date}
          onDateChange={handleDateChange}
          onNavigateCalendar={() => setPage("calendar")}
          seasonColor={seasonColor}
        />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {sidebarVisible ? (
            <Sidebar
              active={page}
              onSelect={setPage}
              onHide={() => setSidebarVisible(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setSidebarVisible(true)}
              style={{
                position: "absolute",
                left: 6,
                top: 80,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "1px solid var(--border, #d2cbbf)",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                color: "var(--text-secondary, #7a6e64)",
                zIndex: 10,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--border, #d2cbbf)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              &gt;
            </button>
          )}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {page === "today" ? (
              <OfficeTabs
                active={tab}
                onSelect={handleTabChange}
                showRubrics={showRubrics}
                onToggleRubrics={() => setShowRubrics((v) => !v)}
                showSpeakers={showSpeakers}
                onToggleSpeakers={() => setShowSpeakers((v) => !v)}
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
              scrollPct={scrollPct}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <View style={styles.shell}>
      <TopBar
        date={date}
        onDateChange={handleDateChange}
        onNavigateCalendar={() => setPage("calendar")}
        seasonColor={seasonColor}
      />
      <View style={styles.body}>
        {sidebarVisible ? (
          <Sidebar
            active={page}
            onSelect={setPage}
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
            />
          ) : null}
          <View style={[styles.content, { transform: [{ scale: fontScale }] }]}>
            {content}
          </View>
          <StatusBar
            season={season}
            seasonColor={seasonColor}
            slot={slot}
            officeName={document.officeName}
            scrollPct={scrollPct}
          />
        </View>
      </View>
    </View>
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
});
