import { Platform } from "react-native";
import { diffDays } from "../../../lib/calendar";
import type { CalendarDate } from "../../../lib/calendar/types";
import type { PageId } from "../Sidebar";

// a transient history step carries its layer name, so the drawer and modal
// steps can be told apart even though they snapshot the same app state
export const LAYER_STEP = "__bcpLayerStep";

export function markHistoryStep(kind: "drawer" | "modal"): string {
  const state = window.history.state;
  if (!state || typeof state !== "object") {
    return JSON.stringify(state ?? null);
  }
  const marked = { ...state, [LAYER_STEP]: kind };
  window.history.replaceState(marked, "");
  return JSON.stringify(marked);
}

export function historyLayer(): string | null {
  const state = window.history.state;
  if (!state || typeof state !== "object") return null;
  const layer = state[LAYER_STEP];
  return typeof layer === "string" ? layer : null;
}

export type TabId = "morning" | "noonday" | "evening" | "compline" | "litany";

// the sidebar's trailing info for the Today row mirrors the office tabs
export const OFFICE_LABEL: Record<TabId, string> = {
  morning: "Morning",
  noonday: "Noonday",
  evening: "Evening",
  compline: "Compline",
  litany: "The Litany",
};

export const OFFICE_LABEL_1662: Partial<Record<TabId, string>> = {
  morning: "Matins",
  evening: "Evensong",
  litany: "The Litany",
};

export const OFFICE_LABEL_1962: Partial<Record<TabId, string>> = {
  morning: "Matins",
  evening: "Evensong",
  litany: "The Litany",
};

export function officeForHour(hour: number): TabId {
  if (hour < 12) return "morning";
  if (hour < 17) return "noonday";
  if (hour < 21) return "evening";
  return "compline";
}

export function officeForHour1662(hour: number): TabId {
  if (hour < 12) return "morning";
  return "evening";
}

// the 1662 book has Matins, Evensong and the Litany, no other daily offices
export function is1662OfficeTab(tab: TabId): boolean {
  return tab === "morning" || tab === "evening" || tab === "litany";
}

export function officeForHour1962(hour: number): TabId {
  if (hour < 12) return "morning";
  return "evening";
}

export function is1962OfficeTab(tab: TabId): boolean {
  return tab === "morning" || tab === "evening" || tab === "litany";
}

// sidebar observance detail: the days until the next fixed feast ("today" on
// a feast day), wrapping to the start of the table when the year ends
export function holyDayCountdown(
  entry: { month: number; day: number },
  from: CalendarDate,
): string {
  const sameYear =
    entry.month > from.month ||
    (entry.month === from.month && entry.day >= from.day);
  const target = {
    year: sameYear ? from.year : from.year + 1,
    month: entry.month,
    day: entry.day,
  };
  const days = diffDays(target, from);
  return days === 0 ? "today" : `in ${days}d`;
}

export function today(): CalendarDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export const IS_WEB = Platform.OS === "web";

// format a computed unit value without float noise
export function u(n: number): string {
  return n.toFixed(4);
}

export function isReferencePage(p: PageId): boolean {
  return (
    p === "psalms" ||
    p === "psalter" ||
    p === "collects" ||
    p === "offices" ||
    p === "saints" ||
    p === "lesser-feasts" ||
    p === "proverbs" ||
    p === "canticles" ||
    p === "old-testament" ||
    p === "new-testament" ||
    p === "apocrypha"
  );
}

export const SIDEBAR_ANIM_STYLE_ID = "sidebar-anim-style";

// entrance animations: desktop fades-and-drifts in from the left edge,
// the mobile drawer slides in from off-screen for a native drawer feel
export function ensureSidebarAnimStyle(): void {
  if (document.getElementById(SIDEBAR_ANIM_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = SIDEBAR_ANIM_STYLE_ID;
  el.textContent = `
@keyframes bcp-sidebar-in {
  from { opacity: 0; transform: var(--bcp-from, translateY(-8px)); }
}
.bcp-sidebar-in {
  animation: bcp-sidebar-in 150ms cubic-bezier(0.2, 0.9, 0.3, 1);
}
.bcp-sidebar-in-left { --bcp-from: translateX(-8px); }
.bcp-drawer {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
.bcp-nav:focus-visible, .bcp-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  border-radius: 6px;
}
@media (prefers-reduced-motion: reduce) {
  .bcp-sidebar-in, .bcp-drawer {
    animation: none; transition: none;
  }
}`;
  document.head.appendChild(el);
}
