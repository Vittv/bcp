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
import { useHistory, useHistoryField } from "../../../context/HistoryContext";
import { lesserFeastBySlug } from "../../../lib/calendar/lesserFeasts";
import { sanctoraleBySlug } from "../../../lib/calendar/sanctorale";
import type { CalendarDate } from "../../../lib/calendar/types";
import { canticleTitle } from "../../../lib/content/canticles";
import { psalmNumbers } from "../../../lib/content/psalter";
import {
  PSALTER_DAY_COUNT,
  psalterDayForDate,
} from "../../../lib/content/psalterDays";
import type { PageStepper } from "../../../lib/input/sequenceNav";
import {
  registerPageStepper,
  stepLinear,
} from "../../../lib/input/sequenceNav";
import {
  type CollectSel,
  defaultLesserFeast,
  defaultSaint,
  FIRST_COLLECT,
  OFFICE_NAMES,
  type OfficeRite,
  type RefOfficeBase,
  refOfficeId,
  today,
} from "./model";
import { useIndexPicker } from "./pickers";

export type ReferenceState = {
  query: string;
  setQuery: (q: string) => void;
  openPsalm: number | null;
  setOpenPsalm: (n: number | null) => void;
  // the open 30-day psalter cycle day (1..30); null shows today's day
  openPsalterDay: number | null;
  setOpenPsalterDay: (n: number | null) => void;
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
  const [selectedCollect, setSelectedCollect] = useIndexPicker(
    "collect",
    "collects",
    page,
    history,
    queryRef,
  );
  const [openSaint, setOpenSaint] = useIndexPicker(
    "saint",
    "saints",
    page,
    history,
    queryRef,
  );
  const [openLesserFeast, setOpenLesserFeast] = useIndexPicker(
    "lesserFeast",
    "lesser-feasts",
    page,
    history,
    queryRef,
  );
  const [openProvChapter, setOpenProvChapter, setProverbRaw] = useIndexPicker(
    "proverb",
    "proverbs",
    page,
    history,
    queryRef,
  );
  const [openCanticle, setOpenCanticle] = useIndexPicker(
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

  // build the stepper for one scripture page: a +1/-1 walk through that
  // page's index, mirroring its bar arrows (psalms and proverbs clamp the
  // same 1..n run the arrows do). the raw setters skip the push the UI
  // arrows make, so arrow strides never leave their own back/forward steps
  const sequenceStepFor = useCallback(
    (p: PageId): PageStepper | null => {
      switch (p) {
        case "psalms": {
          const max = psalmNumbers().length;
          return (delta) => {
            const n = stepLinear(openPsalm ?? 1, 1, max, delta);
            if (n === null) return false;
            setPsalmRaw(n);
            return true;
          };
        }
        case "psalter": {
          return (delta) => {
            const n = stepLinear(
              openPsalterDay ?? psalterDayForDate(today()),
              1,
              PSALTER_DAY_COUNT,
              delta,
            );
            if (n === null) return false;
            setPsalterDayRaw(n);
            return true;
          };
        }
        case "proverbs": {
          // 31 chapters, the same count the proverbs screen hard-codes
          return (delta) => {
            const n = stepLinear(openProvChapter ?? 1, 1, 31, delta);
            if (n === null) return false;
            setProverbRaw(n);
            return true;
          };
        }
        default:
          return null;
      }
    },
    [
      openPsalm,
      setPsalmRaw,
      openPsalterDay,
      setPsalterDayRaw,
      openProvChapter,
      setProverbRaw,
    ],
  );

  // register the active scripture page's stepper for the shell's arrow
  // keys; unregistering on leave keeps the registry current
  useEffect(() => {
    const step = sequenceStepFor(page);
    if (!step) return;
    registerPageStepper(page, step);
    return () => registerPageStepper(page, null);
  }, [page, sequenceStepFor]);

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
  const readingLabel =
    page === "psalms"
      ? `Psalm ${openPsalm ?? 1}`
      : page === "psalter"
        ? `Day ${openPsalterDay ?? psalterDayForDate(today())}`
        : page === "offices"
          ? OFFICE_NAMES[refOfficeId(openOffice ?? "morning", officeRite)]
          : page === "collects"
            ? (selectedCollect ?? FIRST_COLLECT).title
            : page === "saints"
              ? (sanctoraleBySlug(openSaint ?? defaultSaint())?.title ?? null)
              : page === "lesser-feasts"
                ? (lesserFeastBySlug(openLesserFeast ?? defaultLesserFeast())
                    ?.name ?? null)
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
    openPsalterDay,
    setOpenPsalterDay,
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
