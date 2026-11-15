import type { PageId } from "../components/shell/Sidebar";
import type { CalendarDate } from "../lib/calendar/types";
import type {
  CollectSel,
  OfficeRite,
  RefOfficeBase,
} from "../screens/reference/shared";

export type HistoryTab = "morning" | "noonday" | "evening" | "compline";

// the full navigation state a history step snapshots and restores. every
// field is JSON-safe so an entry can cross reloads unchanged.
export type HistorySnapshot = {
  page: PageId;
  date: CalendarDate;
  tab: HistoryTab;
  officeDate: CalendarDate;
  query: string;
  psalm: number | null;
  psalterDay: number | null;
  office: { base: RefOfficeBase; rite: OfficeRite } | null;
  collect: CollectSel | null;
  saint: string | null;
  lesserFeast: string | null;
  proverb: number | null;
  canticle: number | null;
  bible: { abbrev: string; chapter: number } | null;
};

export type HistoryApi = {
  push: (change: Partial<HistorySnapshot>) => void;
  // rewrite the current entry instead of adding a step, used to fold a
  // position materialized without a navigation (e.g. a bible book restored
  // from storage on page entry) into the top snapshot so a later restore
  // of that entry sees the same value the page actually holds
  replace: (change: Partial<HistorySnapshot>) => void;
  // record the live snapshot as its own step, used to reify a filtered
  // index list before opening a detail so Back returns to that list
  record: () => void;
  register: <K extends keyof HistorySnapshot>(
    key: K,
    get: () => HistorySnapshot[K],
    apply: (v: HistorySnapshot[K]) => void,
  ) => () => void;
  onRestored: (
    fn: (entry: Partial<HistorySnapshot>, changed: boolean) => void,
  ) => () => void;
  isRestoring: () => boolean;
};
