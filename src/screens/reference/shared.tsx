import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import type { PageId } from "../../components/shell/Sidebar";
import { useHistory, useHistoryField } from "../../context/HistoryContext";
import {
  SANCTORALE_ENTRIES,
  sanctoraleBySlug,
} from "../../lib/calendar/sanctorale";
import type { CalendarDate } from "../../lib/calendar/types";
import { canticleTitle } from "../../lib/content/canticles";
import type { CollectSection, OfficeId } from "../../lib/content/types";
import { searchCollects } from "../../lib/reference/search";
import { sharedStyles } from "./styles";

// the collect the desktop pane shows before anything is picked: the
// first hit of the full list, i.e. traditional · church-year
export const FIRST_COLLECT = searchCollects("")[0];

// the saint the desktop pane shows before anything is picked: the first
// entry of the calendar, i.e. the Conversion of Saint Peter, Jan 18
export const FIRST_SAINT = SANCTORALE_ENTRIES[0].slug;

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
  openSaint: string | null;
  setOpenSaint: (slug: string | null) => void;
  // the open Proverbs chapter (1..31); null shows the chapter index
  openProvChapter: number | null;
  setOpenProvChapter: (n: number | null) => void;
  // the open Canticle (canticle 1..21); null shows the index
  openCanticle: number | null;
  setOpenCanticle: (n: number | null) => void;
  // the saints detail pane's two toggles: biography and liturgical
  // content (psalms, readings, collect). standalone so both can be on.
  saintBio: boolean;
  setSaintBio: (on: boolean) => void;
  saintLiturgy: boolean;
  setSaintLiturgy: (on: boolean) => void;
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
  // bumps on every navigation into any page, so a search always starts
  // empty (prevents stale queries lingering after a page re-entry)
  navKey: number;
};

// owns the shared reference-browsing state consumed by both the per-page
// bars (rendered by Shell above the content column) and the screens.
export function ReferenceProvider({
  children,
  onReadingChange,
  page,
  navKey,
}: ReferenceProviderProps) {
  const [query, setQuery] = useState("");
  const [openPsalm, setOpenPsalmRaw] = useState<number | null>(null);
  const [openOffice, setOpenOfficeRaw] = useState<RefOfficeBase | null>(null);
  // contemporary first, matching the Today page's default rites
  const [officeRite, setOfficeRiteRaw] = useState<OfficeRite>("Two");
  const [selectedCollect, setSelectedCollectRaw] = useState<CollectSel | null>(
    null,
  );
  const [openSaint, setOpenSaintRaw] = useState<string | null>(null);
  const [openProvChapter, setOpenProvChapterRaw] = useState<number | null>(
    null,
  );
  const [openCanticle, setOpenCanticleRaw] = useState<number | null>(null);
  // the full card (bio and liturgy) leads by default; the reader can
  // hide either half with the bar's toggles
  const [saintBio, setSaintBio] = useState(true);
  const [saintLiturgy, setSaintLiturgy] = useState(true);
  const [officeDate, setOfficeDateRaw] = useState<CalendarDate>(today);

  // browser history: pushes record the selection, restores replay it.
  // refs keep the push-time and pick-time values fresh without re-creating
  // the callbacks on every keystroke (stable identities let the memoized
  // index rows skip re-renders while typing)
  const history = useHistory();
  const queryRef = useRef(query);
  queryRef.current = query;
  const openPsalmRef = useRef(openPsalm);
  openPsalmRef.current = openPsalm;
  const selectedCollectRef = useRef(selectedCollect);
  selectedCollectRef.current = selectedCollect;
  const openSaintRef = useRef(openSaint);
  openSaintRef.current = openSaint;
  const openProvChapterRef = useRef(openProvChapter);
  openProvChapterRef.current = openProvChapter;
  const openCanticleRef = useRef(openCanticle);
  openCanticleRef.current = openCanticle;
  const openOfficeRef = useRef(openOffice);
  openOfficeRef.current = openOffice;
  const officeRiteRef = useRef(officeRite);
  officeRiteRef.current = officeRite;

  // opening a pick keeps whatever search is active: the filter stays live
  // on the index (Desktop split-pane) and rides along in history. before
  // opening from a filtered list, record() reifies that list as its own
  // back step, so system Back lands on the exact filtered list the pick
  // came from instead of the pre-filter entry
  const setOpenPsalm = useCallback(
    (n: number | null) => {
      if (
        n !== null &&
        page === "psalms" &&
        openPsalmRef.current === null &&
        queryRef.current !== ""
      ) {
        history?.record();
      }
      setOpenPsalmRaw(n);
      history?.push({ psalm: n });
    },
    [history, page],
  );
  const setSelectedCollect = useCallback(
    (c: CollectSel | null) => {
      if (
        c !== null &&
        page === "collects" &&
        selectedCollectRef.current === null &&
        queryRef.current !== ""
      ) {
        history?.record();
      }
      setSelectedCollectRaw(c);
      history?.push({ collect: c });
    },
    [history, page],
  );
  const setOpenSaint = useCallback(
    (s: string | null) => {
      if (
        s !== null &&
        page === "saints" &&
        openSaintRef.current === null &&
        queryRef.current !== ""
      ) {
        history?.record();
      }
      setOpenSaintRaw(s);
      history?.push({ saint: s });
    },
    [history, page],
  );
  const setOpenProvChapter = useCallback(
    (n: number | null) => {
      if (
        n !== null &&
        page === "proverbs" &&
        openProvChapterRef.current === null &&
        queryRef.current !== ""
      ) {
        history?.record();
      }
      setOpenProvChapterRaw(n);
      history?.push({ proverb: n });
    },
    [history, page],
  );
  const setOpenCanticle = useCallback(
    (n: number | null) => {
      if (
        n !== null &&
        page === "canticles" &&
        openCanticleRef.current === null &&
        queryRef.current !== ""
      ) {
        history?.record();
      }
      setOpenCanticleRaw(n);
      history?.push({ canticle: n });
    },
    [history, page],
  );
  const setOpenOffice = useCallback(
    (id: RefOfficeBase) => {
      setOpenOfficeRaw(id);
      history?.push({ office: { base: id, rite: officeRiteRef.current } });
    },
    [history],
  );
  const setOfficeRite = useCallback(
    (r: OfficeRite) => {
      setOfficeRiteRaw(r);
      if (openOfficeRef.current) {
        history?.push({
          office: { base: openOfficeRef.current, rite: r },
        });
      }
    },
    [history],
  );
  const setOfficeDate = useCallback(
    (d: CalendarDate) => {
      setOfficeDateRaw(d);
      history?.push({ officeDate: d });
    },
    [history],
  );

  // register the fields restore replays. raw setters only: a restore
  // must re-create the state, never push a follow-up entry. the query is
  // included so Back from a filtered pick returns to the same list
  useHistoryField("query", () => query, setQuery);
  useHistoryField("psalm", () => openPsalm, setOpenPsalmRaw);
  useHistoryField(
    "office",
    () => (openOffice ? { base: openOffice, rite: officeRite } : null),
    (v) => {
      setOpenOfficeRaw(v?.base ?? null);
      if (v) setOfficeRiteRaw(v.rite);
    },
  );
  useHistoryField("collect", () => selectedCollect, setSelectedCollectRaw);
  useHistoryField("saint", () => openSaint, setOpenSaintRaw);
  useHistoryField("proverb", () => openProvChapter, setOpenProvChapterRaw);
  useHistoryField("canticle", () => openCanticle, setOpenCanticleRaw);
  useHistoryField("officeDate", () => officeDate, setOfficeDateRaw);

  // the status bar mirrors what the active page shows, including the
  // default-open first item; other pages' selections never leak in
  const readingLabel =
    page === "psalms"
      ? `Psalm ${openPsalm ?? 1}`
      : page === "offices"
        ? OFFICE_NAMES[refOfficeId(openOffice ?? "morning", officeRite)]
        : page === "collects"
          ? (selectedCollect ?? FIRST_COLLECT).title
          : page === "saints"
            ? (sanctoraleBySlug(openSaint ?? FIRST_SAINT)?.title ?? null)
            : page === "proverbs"
              ? `Proverbs ${openProvChapter ?? 1}`
              : page === "canticles"
                ? (canticleTitle(openCanticle ?? 1) ?? null)
                : null;

  useEffect(() => {
    onReadingChange(readingLabel);
  }, [readingLabel, onReadingChange]);

  // the search query is per-entry: navigating into any page (even the
  // same one again) starts a fresh, empty search. navKey bumps on every
  // explicit navigation; history restores deliberately skip it, so the
  // snapshot's query survives Back/Forward untouched
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on navKey change to clear the search
  useEffect(() => {
    setQuery("");
  }, [navKey, setQuery]);

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
    openSaint,
    setOpenSaint,
    openProvChapter,
    setOpenProvChapter,
    openCanticle,
    setOpenCanticle,
    saintBio,
    setSaintBio,
    saintLiturgy,
    setSaintLiturgy,
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
  onScrollProgress,
}: {
  list: ReactNode;
  detail: ReactNode;
  detailOpen: boolean;
  header?: ReactNode;
  fontScale?: number;
  onScrollProgress?: (pct: number) => void;
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

  const handleDetailScroll = useCallback(() => {
    if (!onScrollProgress) return;
    const el = detailRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    onScrollProgress(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
  }, [onScrollProgress]);

  // biome-ignore-start lint/a11y/noNoninteractiveTabindex: each pane is a
  // scrollable region and must be focusable for native arrow scrolling
  return (
    <div style={SPLIT_STYLE}>
      <div
        ref={detailRef}
        tabIndex={0}
        style={{
          ...DETAIL_PANE_STYLE,
          zoom: fontScale !== 1 ? String(fontScale) : undefined,
        }}
        data-split-detail
        onScroll={handleDetailScroll}
      >
        <View style={sharedStyles.detailPage}>{detail}</View>
      </div>
      <div ref={listRef} tabIndex={0} style={LIST_PANE_STYLE}>
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
