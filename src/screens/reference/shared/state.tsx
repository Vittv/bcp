import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { PageId } from "../../../components/shell/Sidebar";
import { useEdition } from "../../../context/EditionContext";
import { useHistory, useHistoryField } from "../../../context/HistoryContext";
import type { CalendarDate } from "../../../lib/calendar/types";
import {
  type CollectSel,
  type OfficeRite,
  type RefOfficeBase,
  today,
} from "./model";
import { consumePendingReferencePick } from "./pending";
import { useIndexPicker } from "./pickers";
import { readingLabelFor, registerScriptureStepper } from "./state.helpers";

// the 1962 psalter has two appointments: its own 30-day cycle and the
// optional odd/even ordinary weekday table
export type PsalterView = "cycle" | "table";

export type ReferenceState = {
  query: string;
  setQuery: (q: string) => void;
  openPsalm: number | null;
  setOpenPsalm: (n: number | null) => void;
  // the open psalter cycle day (1..30, or 1..31 for the 1962 weekday table);
  // null shows today's day
  openPsalterDay: number | null;
  setOpenPsalterDay: (n: number | null) => void;
  psalterView: PsalterView;
  setPsalterView: (v: PsalterView) => void;
  // base office + rite; the composed id is refOfficeId(openOffice, rite)
  openOffice: RefOfficeBase | null;
  setOpenOffice: (id: RefOfficeBase) => void;
  officeRite: OfficeRite;
  setOfficeRite: (r: OfficeRite) => void;
  selectedCollect: CollectSel | null;
  setSelectedCollect: (c: CollectSel | null) => void;
  openSaint: string | null;
  setOpenSaint: (slug: string | null) => void;
  openLesserFeast: string | null;
  setOpenLesserFeast: (slug: string | null) => void;
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

  // browser history: pushes record the selection, restores replay it.
  // refs keep the push-time and pick-time values fresh without re-creating
  // the callbacks on every keystroke (stable identities let the memoized
  // index rows skip re-renders while typing)
  const history = useHistory();
  const queryRef = useRef(query);
  queryRef.current = query;

  // the seven index pickers share one restorable-field implementation:
  // opening pushes the pick, the mobile back pushes null, and restores
  // replay both branches through the raw setter
  const [openPsalm, setOpenPsalm, setPsalmRaw] = useIndexPicker(
    "psalm",
    "psalms",
    page,
    history,
    queryRef,
  );
  const [openPsalterDay, setOpenPsalterDay, setPsalterDayRaw] = useIndexPicker(
    "psalterDay",
    "psalter",
    page,
    history,
    queryRef,
  );
  const [selectedCollect, setSelectedCollect, setCollectRaw] = useIndexPicker(
    "collect",
    "collects",
    page,
    history,
    queryRef,
  );
  const [openSaint, setOpenSaint, setSaintRaw] = useIndexPicker(
    "saint",
    "saints",
    page,
    history,
    queryRef,
  );
  const [openLesserFeast, setOpenLesserFeast, setLesserFeastRaw] =
    useIndexPicker("lesserFeast", "lesser-feasts", page, history, queryRef);
  const [openProvChapter, setOpenProvChapter, setProverbRaw] = useIndexPicker(
    "proverb",
    "proverbs",
    page,
    history,
    queryRef,
  );
  const [openCanticle, setOpenCanticle, setCanticleRaw] = useIndexPicker(
    "canticle",
    "canticles",
    page,
    history,
    queryRef,
  );

  const [openOffice, setOpenOfficeRaw] = useState<RefOfficeBase | null>(null);
  // contemporary first, matching the Today page's default rites
  const [officeRite, setOfficeRiteRaw] = useState<OfficeRite>("Two");
  // the full card (bio and liturgy) leads by default; the reader can
  // hide either half with the bar's toggles
  const [saintBio, setSaintBio] = useState(true);
  const [saintLiturgy, setSaintLiturgy] = useState(true);
  const [psalterView, setPsalterView] = useState<PsalterView>("cycle");
  const [officeDate, setOfficeDateRaw] = useState<CalendarDate>(today);

  // the office drop-down has no picker-page state of its own: selection is
  // the composed office id, so only its refs stay local to the provider
  const openOfficeRef = useRef(openOffice);
  openOfficeRef.current = openOffice;
  const officeRiteRef = useRef(officeRite);
  officeRiteRef.current = officeRite;

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

  // register the active scripture page's stepper for the shell's arrow
  // keys; unregistering on leave keeps the registry current
  useEffect(
    () =>
      registerScriptureStepper({
        page,
        openPsalm,
        setPsalmRaw,
        openPsalterDay,
        setPsalterDayRaw,
        openProvChapter,
        setProverbRaw,
      }),
    [
      page,
      openPsalm,
      setPsalmRaw,
      openPsalterDay,
      setPsalterDayRaw,
      openProvChapter,
      setProverbRaw,
    ],
  );

  // register the fields restore replays. raw setters only: a restore
  // must re-create the state, never push a follow-up entry. the query is
  // included so Back from a filtered pick returns to the same list
  useHistoryField("query", () => query, setQuery);
  useHistoryField(
    "office",
    () => (openOffice ? { base: openOffice, rite: officeRite } : null),
    (v) => {
      setOpenOfficeRaw(v?.base ?? null);
      if (v) setOfficeRiteRaw(v.rite);
    },
  );
  useHistoryField("officeDate", () => officeDate, setOfficeDateRaw);

  // the status bar mirrors what the active page shows, including the
  // default-open first item; other pages' selections never leak in
  const { edition } = useEdition();
  // feast slugs belong to one church's calendar. a selection kept while
  // switching books rarely resolves in the new one, and the natural entry
  // point for these pages is today's observance, so drop it on edition change.
  const previousEdition = useRef(edition);
  useEffect(() => {
    if (previousEdition.current === edition) return;
    previousEdition.current = edition;
    setSaintRaw(null);
    setLesserFeastRaw(null);
  }, [edition, setSaintRaw, setLesserFeastRaw]);
  const readingLabel = readingLabelFor({
    edition,
    page,
    openPsalm,
    openPsalterDay,
    openOffice,
    officeRite,
    selectedCollect,
    openSaint,
    openLesserFeast,
    openProvChapter,
    openCanticle,
  });

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

  // apply a pending global-search selection for the page being entered, so
  // cross-page jumps land on the picked item in one history step (the
  // navigation already carried the selection in its snapshot extras)
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on navKey so each navigation can apply its pending pick
  useEffect(() => {
    const pending = consumePendingReferencePick();
    if (!pending) return;
    switch (page) {
      case "psalms":
        if (pending.psalm != null) {
          setPsalmRaw(pending.psalm);
          history?.replace({ psalm: pending.psalm });
        }
        break;
      case "psalter":
        if (pending.psalterDay != null) {
          setPsalterDayRaw(pending.psalterDay);
          history?.replace({ psalterDay: pending.psalterDay });
        }
        break;
      case "collects":
        if (pending.collect != null) {
          setCollectRaw(pending.collect);
          history?.replace({ collect: pending.collect });
        }
        break;
      case "saints":
        if (pending.saint != null) {
          setSaintRaw(pending.saint);
          history?.replace({ saint: pending.saint });
        }
        break;
      case "lesser-feasts":
        if (pending.lesserFeast != null) {
          setLesserFeastRaw(pending.lesserFeast);
          history?.replace({ lesserFeast: pending.lesserFeast });
        }
        break;
      case "proverbs":
        if (pending.proverb != null) {
          setProverbRaw(pending.proverb);
          history?.replace({ proverb: pending.proverb });
        }
        break;
      case "canticles":
        if (pending.canticle != null) {
          setCanticleRaw(pending.canticle);
          history?.replace({ canticle: pending.canticle });
        }
        break;
      default:
        break;
    }
  }, [
    page,
    navKey,
    history,
    setPsalmRaw,
    setPsalterDayRaw,
    setCollectRaw,
    setSaintRaw,
    setLesserFeastRaw,
    setProverbRaw,
    setCanticleRaw,
  ]);

  const state: ReferenceState = {
    query,
    setQuery,
    openPsalm,
    setOpenPsalm,
    openPsalterDay,
    setOpenPsalterDay,
    psalterView,
    setPsalterView,
    openOffice,
    setOpenOffice,
    officeRite,
    setOfficeRite,
    selectedCollect,
    setSelectedCollect,
    openSaint,
    setOpenSaint,
    openLesserFeast,
    setOpenLesserFeast,
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
