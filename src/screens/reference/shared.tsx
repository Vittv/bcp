import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import type { PageId } from "../../components/shell/Sidebar";
import type { CalendarDate } from "../../lib/calendar/types";
import type { CollectSection, OfficeId } from "../../lib/content/types";
import { searchCollects } from "../../lib/reference/search";
import { sharedStyles } from "./styles";

// the collect the desktop pane shows before anything is picked: the
// first hit of the full list, i.e. traditional · church-year
export const FIRST_COLLECT = searchCollects("")[0];

export const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

// split-layout pane styles: plain web CSS, since the panes are raw
// focusable scrollers rather than RN views
const SPLIT_STYLE: React.CSSProperties = {
  display: "flex",
  flex: 1,
  height: "100%",
  minHeight: 0,
};
const LIST_PANE_STYLE: React.CSSProperties = {
  boxSizing: "border-box",
  outline: "none",
  width: "25%",
  minWidth: 260,
  maxWidth: 340,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  borderLeft: "1px solid var(--border-faint, rgba(44, 32, 32, 0.09))",
};
const SPLIT_HEADER_STYLE: React.CSSProperties = {
  flexShrink: 0,
  borderBottom: "1px solid var(--border, #c3bcb2)",
  flexDirection: "row",
  alignItems: "center",
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 18,
  paddingRight: 18,
};
const SPLIT_LIST_SCROLL_STYLE: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
};
const DETAIL_PANE_STYLE: React.CSSProperties = {
  boxSizing: "border-box",
  outline: "none",
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
};

// the offices reference page browses the seven printed offices;
// devotions are reachable from the Today view instead.
export type RefOfficeId = Exclude<OfficeId, `devotions-${string}`>;

// morning and evening exist in both rites; the rite is a toggle in the
// bar rather than separate tabs, so selection tracks the base office
export type RefOfficeBase =
  | "morning"
  | "evening"
  | "noonday"
  | "owe"
  | "compline";
export type OfficeRite = "One" | "Two";

export const BASE_OFFICES: {
  id: RefOfficeBase;
  label: string;
  name: string;
}[] = [
  { id: "morning", label: "Morning", name: "Morning Prayer" },
  { id: "evening", label: "Evening", name: "Evening Prayer" },
  { id: "noonday", label: "Noonday", name: "Noonday Prayer" },
  {
    id: "owe",
    label: "Order",
    name: "Order of Worship for the Evening",
  },
  { id: "compline", label: "Compline", name: "Compline" },
];

export function refOfficeId(
  base: RefOfficeBase,
  rite: OfficeRite,
): RefOfficeId {
  switch (base) {
    case "morning":
      return `morning-rite-${rite === "One" ? "one" : "two"}`;
    case "evening":
      return `evening-rite-${rite === "One" ? "one" : "two"}`;
    default:
      return base;
  }
}

export const OFFICE_NAMES: Record<RefOfficeId, string> = {
  "morning-rite-one": "Morning Prayer — Rite One",
  "morning-rite-two": "Morning Prayer — Rite Two",
  "evening-rite-one": "Evening Prayer — Rite One",
  "evening-rite-two": "Evening Prayer — Rite Two",
  noonday: "Noonday Prayer",
  owe: "Order of Worship for the Evening",
  compline: "Compline",
};

// a collect picked in the index; both rites render together in the
// detail pane, so a selection needs no rite of its own
export type CollectSel = {
  section: CollectSection;
  title: string;
};

export type ReferenceState = {
  query: string;
  setQuery: (q: string) => void;
  openPsalm: number | null;
  setOpenPsalm: (n: number | null) => void;
  // base office + rite; the composed id is refOfficeId(openOffice, rite)
  openOffice: RefOfficeBase | null;
  setOpenOffice: (id: RefOfficeBase) => void;
  officeRite: OfficeRite;
  setOfficeRite: (r: OfficeRite) => void;
  selectedCollect: CollectSel | null;
  setSelectedCollect: (c: CollectSel | null) => void;
  officeDate: CalendarDate;
  setOfficeDate: (d: CalendarDate) => void;
};

const ReferenceContext = createContext<ReferenceState | null>(null);

export function useReference(): ReferenceState {
  const ctx = useContext(ReferenceContext);
  if (!ctx) throw new Error("useReference outside ReferenceProvider");
  return ctx;
}

type ReferenceProviderProps = {
  children: ReactNode;
  onReadingChange: (label: string | null) => void;
  // the active sidebar page: the status bar reflects what the current
  // page actually displays, defaults included
  page: PageId;
};

// owns the shared reference-browsing state consumed by both the per-page
// bars (rendered by Shell above the content column) and the screens.
export function ReferenceProvider({
  children,
  onReadingChange,
  page,
}: ReferenceProviderProps) {
  const [query, setQuery] = useState("");
  const [openPsalm, setOpenPsalm] = useState<number | null>(null);
  const [openOffice, setOpenOffice] = useState<RefOfficeBase | null>(null);
  // contemporary first, matching the Today page's default rites
  const [officeRite, setOfficeRite] = useState<OfficeRite>("Two");
  const [selectedCollect, setSelectedCollect] = useState<CollectSel | null>(
    null,
  );
  const [officeDate, setOfficeDate] = useState<CalendarDate>(today);

  // the status bar mirrors what the active page shows, including the
  // default-open first item; other pages' selections never leak in
  const readingLabel =
    page === "psalms"
      ? `Psalm ${openPsalm ?? 1}`
      : page === "offices"
        ? OFFICE_NAMES[refOfficeId(openOffice ?? "morning", officeRite)]
        : page === "collects"
          ? (selectedCollect ?? FIRST_COLLECT).title
          : null;

  useEffect(() => {
    onReadingChange(readingLabel);
  }, [readingLabel, onReadingChange]);

  const state: ReferenceState = {
    query,
    setQuery,
    openPsalm,
    setOpenPsalm,
    openOffice,
    setOpenOffice,
    officeRite,
    setOfficeRite,
    selectedCollect,
    setSelectedCollect,
    officeDate,
    setOfficeDate,
  };

  return (
    <ReferenceContext.Provider value={state}>
      {children}
    </ReferenceContext.Provider>
  );
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

// desktop: persistent index beside a detail pane; the panes scroll
// independently and take keyboard focus as selection moves
export function SplitPane({
  list,
  detail,
  detailOpen,
  header,
  fontScale = 1,
}: {
  list: ReactNode;
  detail: ReactNode;
  detailOpen: boolean;
  header?: ReactNode;
  fontScale?: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!IS_WEB) return;
    listRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!IS_WEB) return;
    (detailOpen ? detailRef.current : listRef.current)?.focus({
      preventScroll: true,
    });
  }, [detailOpen]);

  const listScale =
    fontScale !== 1
      ? { transform: `scale(${1 / fontScale})`, transformOrigin: "top left" }
      : undefined;

  // biome-ignore-start lint/a11y/noNoninteractiveTabindex: each pane is a
  // scrollable region and must be focusable for native arrow scrolling
  return (
    <div style={SPLIT_STYLE}>
      <div ref={detailRef} tabIndex={0} style={DETAIL_PANE_STYLE}>
        <View style={sharedStyles.detailPage}>{detail}</View>
      </div>
      <div
        ref={listRef}
        tabIndex={0}
        style={{ ...LIST_PANE_STYLE, ...listScale }}
      >
        {header ? <div style={SPLIT_HEADER_STYLE}>{header}</div> : null}
        <div style={SPLIT_LIST_SCROLL_STYLE}>{list}</div>
      </div>
    </div>
  );
  // biome-ignore-end lint/a11y/noNoninteractiveTabindex: see above
}

// mobile detail wrapper: the pane scrolls the document column.
// compact switches to the phone-width inset so opened psalms,
// collects and offices breathe like Today does on small screens
export function DetailPage({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <ScrollView
      style={sharedStyles.list}
      contentContainerStyle={{ alignItems: "center" }}
    >
      <View
        style={[
          sharedStyles.detailPage,
          compact && sharedStyles.detailPageMobile,
        ]}
      >
        {children}
      </View>
    </ScrollView>
  );
}

export function EmptyMessage({ message }: { message: string }) {
  return <Text style={sharedStyles.empty}>{message}</Text>;
}
