import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { OfficeView } from "../components/office/OfficeView";
import { PsalmText } from "../components/office/PsalmText";
import { Chevron } from "../components/shell/Chevron";
import type { CalendarDate } from "../lib/calendar/types";
import {
  collectPassage,
  collectText,
  counterpartCollect,
} from "../lib/content/collects";
import { psalmPassage } from "../lib/content/psalter";
import type {
  CollectRite,
  CollectSection,
  OfficeId,
} from "../lib/content/types";
import { composeOffice, dayLabel } from "../lib/office";
import { DEFAULT_PREFS } from "../lib/office/types";
import { searchCollects, searchPsalms } from "../lib/reference/search";

const SERIF = '"Crimson Text", Georgia, "Times New Roman", serif';
const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function today(): CalendarDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

const noSelect = {
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
  width: 340,
  flexShrink: 0,
  overflowY: "auto",
  borderRight: "1px solid var(--border-faint, rgba(127,127,127,0.14))",
};
const DETAIL_PANE_STYLE: React.CSSProperties = {
  boxSizing: "border-box",
  outline: "none",
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
};

type RefTab = "psalms" | "collects" | "offices";

const TABS: { id: RefTab; label: string }[] = [
  { id: "psalms", label: "Psalms" },
  { id: "collects", label: "Collects" },
  { id: "offices", label: "Offices" },
];

const RITE_LABELS: Record<CollectRite, string> = {
  traditional: "Traditional (Rite I)",
  contemporary: "Contemporary (Rite II)",
};

// the reference pages browse the seven printed offices; devotions are
// reachable from the Today view instead.
type RefOfficeId = Exclude<OfficeId, `devotions-${string}`>;

const OFFICE_NAMES: Record<RefOfficeId, string> = {
  "morning-rite-one": "Morning Prayer — Rite One",
  "morning-rite-two": "Morning Prayer — Rite Two",
  "evening-rite-one": "Evening Prayer — Rite One",
  "evening-rite-two": "Evening Prayer — Rite Two",
  noonday: "Noonday Prayer",
  owe: "Order of Worship for the Evening",
  compline: "Compline",
};

// SAFETY: OFFICE_NAMES is a full Record<RefOfficeId, string>, so its keys
// are exactly the RefOfficeId union.
const OFFICE_IDS = Object.keys(OFFICE_NAMES) as RefOfficeId[];

// a collect picked in the index; its cross-rite counterpart renders
// beside it in the detail pane
type CollectSel = {
  rite: CollectRite;
  section: CollectSection;
  title: string;
};

type ReferenceState = {
  tab: RefTab;
  setTab: (t: RefTab) => void;
  query: string;
  setQuery: (q: string) => void;
  openPsalm: number | null;
  setOpenPsalm: (n: number | null) => void;
  openOffice: RefOfficeId | null;
  setOpenOffice: (id: RefOfficeId | null) => void;
  selectedCollect: CollectSel | null;
  setSelectedCollect: (c: CollectSel | null) => void;
};

const ReferenceContext = createContext<ReferenceState | null>(null);

function useReference(): ReferenceState {
  const ctx = useContext(ReferenceContext);
  if (!ctx) throw new Error("useReference outside ReferenceProvider");
  return ctx;
}

type ReferenceProviderProps = {
  children: ReactNode;
  onReadingChange: (label: string | null) => void;
};

// owns the shared reference-browsing state consumed by both the bar
// (rendered by Shell above the content column) and this screen.
export function ReferenceProvider({
  children,
  onReadingChange,
}: ReferenceProviderProps) {
  const [tab, setTab] = useState<RefTab>("psalms");
  const [query, setQuery] = useState("");
  const [openPsalm, setOpenPsalm] = useState<number | null>(null);
  const [openOffice, setOpenOffice] = useState<RefOfficeId | null>(null);
  const [selectedCollect, setSelectedCollect] = useState<CollectSel | null>(
    null,
  );

  const readingLabel =
    openPsalm !== null
      ? `Psalm ${openPsalm}`
      : openOffice !== null
        ? OFFICE_NAMES[openOffice]
        : selectedCollect !== null
          ? `${selectedCollect.title} · ${selectedCollect.rite === "traditional" ? "Rite I" : "Rite II"}`
          : null;

  useEffect(() => {
    onReadingChange(readingLabel);
  }, [readingLabel, onReadingChange]);

  const state: ReferenceState = {
    tab,
    setTab,
    query,
    setQuery,
    openPsalm,
    setOpenPsalm,
    openOffice,
    setOpenOffice,
    selectedCollect,
    setSelectedCollect,
  };

  return (
    <ReferenceContext.Provider value={state}>
      {children}
    </ReferenceContext.Provider>
  );
}

const IS_WEB = Platform.OS === "web";

export function OfficesScreen({ isMobile }: { isMobile: boolean }) {
  if (isMobile) return <MobileOffices />;
  return <SplitOffices />;
}

// phones: the detail replaces the index, exactly one column at a time
function MobileOffices() {
  const {
    tab,
    query,
    openPsalm,
    openOffice,
    selectedCollect,
    setOpenPsalm,
    setOpenOffice,
  } = useReference();
  return (
    <View style={styles.container}>
      {openPsalm !== null ? (
        <DetailPage>
          <PsalmDetailBody psalm={openPsalm} />
        </DetailPage>
      ) : openOffice !== null ? (
        <DetailPage>
          <OfficeDetailBody officeId={openOffice} />
        </DetailPage>
      ) : selectedCollect !== null ? (
        <DetailPage>
          <CollectCompare sel={selectedCollect} />
        </DetailPage>
      ) : tab === "psalms" ? (
        <PsalmIndex query={query} selected={null} onSelect={setOpenPsalm} />
      ) : tab === "collects" ? (
        <CollectList query={query} />
      ) : (
        <OfficeIndex selected={null} onSelect={setOpenOffice} />
      )}
    </View>
  );
}

// desktop: persistent index beside a detail pane; the panes scroll
// independently and take keyboard focus as selection moves
function SplitOffices() {
  const {
    tab,
    query,
    openPsalm,
    openOffice,
    selectedCollect,
    setOpenPsalm,
    setOpenOffice,
    setSelectedCollect,
  } = useReference();

  const listRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!IS_WEB) return;
    listRef.current?.focus({ preventScroll: true });
  }, []);

  const selectionKey = `${tab}-${openPsalm ?? ""}-${openOffice ?? ""}-${selectedCollect?.title ?? ""}`;
  useEffect(() => {
    if (!IS_WEB) return;
    const busy =
      openPsalm !== null || openOffice !== null || selectedCollect !== null;
    (busy ? detailRef.current : listRef.current)?.focus({
      preventScroll: true,
    });
  }, [openPsalm, openOffice, selectedCollect]);

  const list =
    tab === "psalms" ? (
      <PsalmIndex
        query={query}
        selected={openPsalm}
        onSelect={(n) => setOpenPsalm(openPsalm === n ? null : n)}
      />
    ) : tab === "collects" ? (
      <CollectIndex selected={selectedCollect} onSelect={setSelectedCollect} />
    ) : (
      <OfficeIndex
        selected={openOffice}
        onSelect={(id) => setOpenOffice(openOffice === id ? null : id)}
      />
    );

  const detail =
    openPsalm !== null ? (
      <PsalmDetailBody psalm={openPsalm} key={`p${openPsalm}`} />
    ) : openOffice !== null ? (
      <OfficeDetailBody officeId={openOffice} key={`o${openOffice}`} />
    ) : selectedCollect !== null ? (
      <CollectCompare sel={selectedCollect} key={selectionKey} />
    ) : (
      <PaneHint tab={tab} />
    );

  // biome-ignore-start lint/a11y/noNoninteractiveTabindex: each pane is a
  // scrollable region and must be focusable for native arrow scrolling
  return (
    <div style={SPLIT_STYLE}>
      <div ref={listRef} tabIndex={0} style={LIST_PANE_STYLE}>
        {list}
      </div>
      <div ref={detailRef} tabIndex={0} style={DETAIL_PANE_STYLE}>
        <View style={styles.detailPage}>{detail}</View>
      </div>
    </div>
  );
  // biome-ignore-end lint/a11y/noNoninteractiveTabindex: see above
}

// the reference bar, rendered by Shell above the content area. the
// back button only exists on mobile, where the detail replaces the
// index instead of sitting beside it.
export function ReferenceBar({
  leading,
  isMobile,
}: {
  leading?: ReactNode;
  isMobile: boolean;
}) {
  const ref = useContext(ReferenceContext);
  if (!ref) return null;
  const {
    tab,
    setTab,
    query,
    setQuery,
    openPsalm,
    setOpenPsalm,
    openOffice,
    setOpenOffice,
    setSelectedCollect,
  } = ref;
  const detailOpen =
    openPsalm !== null || openOffice !== null || ref.selectedCollect !== null;
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            style={({ hovered }) => [
              styles.tab,
              tab === t.id && styles.tabActive,
              hovered && tab !== t.id && styles.tabHover,
            ]}
            onPress={() => {
              setTab(t.id);
              setQuery("");
              setOpenPsalm(null);
              setOpenOffice(null);
              setSelectedCollect(null);
            }}
          >
            <Text
              style={[styles.tabText, tab === t.id && styles.tabTextActive]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
        {isMobile && detailOpen ? (
          <Pressable
            style={({ hovered }) => [
              styles.backBtn,
              hovered && styles.tabHover,
            ]}
            onPress={() => {
              setOpenPsalm(null);
              setOpenOffice(null);
              setSelectedCollect(null);
            }}
            accessibilityLabel="Back to list"
            accessibilityRole="button"
          >
            <Chevron direction="left" size={5} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.barRight}>
        {!detailOpen && tab !== "offices" ? (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              tab === "psalms"
                ? "Search by number or text"
                : "Search by title or text"
            }
            placeholderTextColor="var(--text-secondary, #7a6e64)"
            style={styles.search}
            accessibilityLabel={`Search ${tab}`}
          />
        ) : null}
      </View>
    </View>
  );
}

// psalm index shared by both layouts; `selected` drives the highlight
function PsalmIndex({
  query,
  selected,
  onSelect,
}: {
  query: string;
  selected: number | null;
  onSelect: (psalm: number) => void;
}) {
  const hits = searchPsalms(query);
  if (hits.length === 0) {
    return <EmptyMessage message={`No psalms match “${query}”.`} />;
  }
  return (
    <View style={styles.indexBody}>
      {hits.map((hit) => {
        const isSelected = hit.psalm === selected;
        return (
          <Pressable
            key={hit.psalm}
            style={({ hovered }) => [
              styles.row,
              isSelected && styles.rowSelected,
              hovered && !isSelected && styles.rowHover,
            ]}
            onPress={() => onSelect(hit.psalm)}
          >
            <View style={styles.rowInner}>
              <Text style={styles.psalmNumber}>{hit.psalm}</Text>
              <Text numberOfLines={1} style={styles.incipit}>
                {hit.incipit}
              </Text>
              <Text style={styles.rowMeta}>
                {hit.verses} verse{hit.verses === 1 ? "" : "s"}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function PsalmDetailBody({ psalm }: { psalm: number }) {
  const passage = useMemo(() => psalmPassage({ psalm }), [psalm]);
  const verses = passage?.verses.length ?? 0;
  return (
    <>
      <Text style={styles.detailTitle}>Psalm {psalm}</Text>
      <Text style={styles.detailSubtitle}>
        {verses} verse{verses === 1 ? "" : "s"}
      </Text>
      {passage ? <PsalmText passage={passage} /> : null}
    </>
  );
}

function CollectList({ query }: { query: string }) {
  const hits = searchCollects(query);
  if (hits.length === 0) {
    return <EmptyMessage message={`No collects match “${query}”.`} />;
  }
  const groups: { key: string; rite: CollectRite; section: string }[] = [];
  for (const hit of hits) {
    const key = `${hit.rite}:${hit.section}`;
    if (!groups.some((g) => g.key === key)) {
      groups.push({ key, rite: hit.rite, section: hit.section });
    }
  }
  return (
    <ScrollView style={styles.list}>
      {groups.map((group) => (
        <View key={group.key} style={styles.collectGroup}>
          <Text style={[styles.groupHeading, styles.groupRule]}>
            {RITE_LABELS[group.rite]} · {sectionLabel(group.section)}
          </Text>
          {hits
            .filter((h) => h.rite === group.rite && h.section === group.section)
            .map((hit) => (
              <View
                key={`${hit.rite}:${hit.section}:${hit.title}`}
                style={styles.collectCard}
              >
                <Text style={styles.collectTitle}>{hit.title}</Text>
                <Text style={styles.collectBody}>
                  {collectText(hit.rite, hit.section, hit.title)}
                </Text>
              </View>
            ))}
        </View>
      ))}
    </ScrollView>
  );
}

const SECTION_LABELS: Record<string, string> = {
  "church-year": "The Church Year",
  "holy-days": "Holy Days",
  "common-of-saints": "Common of Saints",
  "various-occasions": "Various Occasions",
};

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section;
}

function OfficeIndex({
  selected,
  onSelect,
}: {
  selected: RefOfficeId | null;
  onSelect: (id: RefOfficeId) => void;
}) {
  return (
    <View style={styles.indexBody}>
      {OFFICE_IDS.map((id) => {
        const isSelected = id === selected;
        return (
          <Pressable
            key={id}
            style={({ hovered }) => [
              styles.row,
              isSelected && styles.rowSelected,
              hovered && !isSelected && styles.rowHover,
            ]}
            onPress={() => onSelect(id)}
          >
            {({ hovered }) => (
              <View style={styles.rowInner}>
                <Text numberOfLines={1} style={styles.officeRowName}>
                  {OFFICE_NAMES[id]}
                </Text>
                <View
                  style={[
                    styles.rowChevron,
                    (hovered || isSelected) && styles.rowChevronShown,
                  ]}
                >
                  <Chevron direction="right" size={6} />
                </View>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function OfficeDetailBody({ officeId }: { officeId: RefOfficeId }) {
  const document = useMemo(
    () =>
      composeOffice(today(), officeId, {
        ...DEFAULT_PREFS,
        personalMode: false,
        showRubrics: true,
      }),
    [officeId],
  );
  return (
    <>
      <Text style={styles.detailTitle}>{document.officeName}</Text>
      <Text style={styles.detailSubtitle}>
        as appointed for {dayLabel(document.date)}
      </Text>
      <OfficeView document={document} showRubrics showSpeakers />
    </>
  );
}

// mobile detail wrapper: the pane scrolls the document column
function DetailPage({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.list}>
      <View style={styles.detailPage}>{children}</View>
    </ScrollView>
  );
}

// selectable collect index for the split layout: titles only, grouped
// by rite and section in printed order
function CollectIndex({
  selected,
  onSelect,
}: {
  selected: CollectSel | null;
  onSelect: (c: CollectSel | null) => void;
}) {
  const hits = searchCollects("");
  const groups: { rite: CollectRite; section: string }[] = [];
  for (const hit of hits) {
    if (!groups.some((g) => g.rite === hit.rite && g.section === hit.section)) {
      groups.push({ rite: hit.rite, section: hit.section });
    }
  }
  return (
    <View style={styles.indexBody}>
      {groups.map((group) => (
        <View
          key={`${group.rite}:${group.section}`}
          style={styles.collectGroup}
        >
          <Text
            style={[
              styles.groupHeading,
              styles.groupRule,
              styles.groupHeadingIndex,
            ]}
          >
            {RITE_LABELS[group.rite]} · {sectionLabel(group.section)}
          </Text>
          {hits
            .filter((h) => h.rite === group.rite && h.section === group.section)
            .map((hit) => {
              const isSelected =
                selected?.rite === hit.rite && selected?.title === hit.title;
              return (
                <Pressable
                  key={`${hit.rite}:${hit.title}`}
                  style={({ hovered }) => [
                    styles.indexRow,
                    isSelected && styles.rowSelected,
                    hovered && !isSelected && styles.rowHover,
                  ]}
                  onPress={() =>
                    onSelect(
                      isSelected
                        ? null
                        : {
                            rite: hit.rite,
                            section: hit.section,
                            title: hit.title,
                          },
                    )
                  }
                >
                  <Text numberOfLines={2} style={styles.indexTitle}>
                    {hit.title}
                  </Text>
                </Pressable>
              );
            })}
        </View>
      ))}
    </View>
  );
}

// facing pages: the chosen rite on the left, its counterpart beside it;
// occasions pair 1:1 by title so a missing counterpart is data rot
function CollectCompare({ sel }: { sel: CollectSel }) {
  const primary = collectPassage(sel.rite, sel.section, sel.title);
  const other = counterpartCollect(sel.rite, sel.section, sel.title);
  if (!primary) return null;
  const columns = [primary, ...(other ? [other] : [])];
  return (
    <>
      <Text style={styles.detailTitle}>{sel.title}</Text>
      <Text style={styles.detailSubtitle}>{sectionLabel(sel.section)}</Text>
      <View style={styles.compareRow}>
        {columns.map((c) => (
          <View key={c.rite} style={styles.compareCol}>
            <Text style={styles.compareRite}>{RITE_LABELS[c.rite]}</Text>
            <Text style={styles.collectBody}>{c.text}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function PaneHint({ tab }: { tab: RefTab }) {
  const noun =
    tab === "psalms" ? "psalm" : tab === "collects" ? "collect" : "office";
  return (
    <View style={styles.hintWrap}>
      <Text style={styles.empty}>Select a {noun} from the index.</Text>
    </View>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return <Text style={styles.empty}>{message}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
  },
  bar: {
    height: 34,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    backgroundColor: "var(--bg, #e0dbd0)",
    flexShrink: 0,
  },
  barLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  barRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  search: {
    maxWidth: 300,
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: SANS,
    fontSize: 12,
    color: "var(--text, #2c2020)",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 8,
  },
  backText: {
    fontFamily: SANS,
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
  },
  tabActive: {
    backgroundColor: "var(--border, #d2cbbf)",
  },
  tabHover: {
    backgroundColor: "var(--border, #d2cbbf)",
  },
  tabText: {
    fontFamily: SANS,
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
  },
  tabTextActive: {
    color: "var(--accent, #7a3040)",
    fontWeight: "700",
  },
  list: {
    flexGrow: 1,
  },
  // file-manager rows: full-width hover bands over faint dividers;
  // horizontal padding lives on rowInner so the band spans the column
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(127,127,127,0.14))",
  },
  rowHover: {
    backgroundColor: "var(--row-hover, rgba(127,127,127,0.08))",
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  rowMeta: {
    marginLeft: "auto",
    fontFamily: SANS,
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
    fontVariant: ["tabular-nums"],
  },
  rowChevron: {
    opacity: 0,
  },
  rowChevronShown: {
    opacity: 1,
  },
  rowSelected: {
    backgroundColor: "var(--selected-bg, rgba(127,127,127,0.18))",
  },
  indexBody: {
    paddingBottom: 24,
  },
  indexRow: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(127,127,127,0.14))",
  },
  indexTitle: {
    fontFamily: SANS,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    color: "var(--text, #2c2020)",
  },
  compareRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 32,
  },
  compareCol: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 320,
    minWidth: 280,
  },
  compareRite: {
    fontFamily: SANS,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 10,
  },
  hintWrap: {
    flex: 1,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  psalmNumber: {
    width: 52,
    textAlign: "right",
    fontFamily: SANS,
    fontSize: 15,
    fontWeight: "700",
    color: "var(--accent, #7a3040)",
    fontVariant: ["tabular-nums"],
  },
  incipit: {
    fontFamily: SERIF,
    fontSize: 18,
    color: "var(--text, #2c2020)",
    flex: 1,
  },
  empty: {
    fontFamily: SANS,
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  // detail views keep a readable measure but sit hard left, unlike the
  // centered document column used by the Today page
  detailPage: {
    width: "100%",
    maxWidth: 928,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 64,
  },
  detailTitle: {
    fontFamily: SERIF,
    fontSize: 30,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 4,
  },
  detailSubtitle: {
    fontFamily: SANS,
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 22,
  },
  collectGroup: {
    marginBottom: 28,
  },
  groupHeading: {
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginBottom: 10,
  },
  groupRule: {
    borderTopWidth: 1,
    borderTopColor: "var(--border-faint, rgba(127,127,127,0.14))",
    paddingTop: 12,
  },
  // desktop index rows pad 14; the heading text lines up with them
  groupHeadingIndex: {
    paddingLeft: 14,
  },
  collectCard: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(127,127,127,0.14))",
  },
  collectTitle: {
    fontFamily: SANS,
    fontSize: 13,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 4,
  },
  collectBody: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 27,
    color: "var(--text, #2c2020)",
  },
  officeRowName: {
    fontFamily: SERIF,
    fontSize: 19,
    color: "var(--text, #2c2020)",
    flex: 1,
  },
});
