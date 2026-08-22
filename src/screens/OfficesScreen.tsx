import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
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
import { collectText } from "../lib/content/collects";
import { psalmPassage } from "../lib/content/psalter";
import type { CollectRite, OfficeId } from "../lib/content/types";
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

type ReferenceState = {
  tab: RefTab;
  setTab: (t: RefTab) => void;
  query: string;
  setQuery: (q: string) => void;
  openPsalm: number | null;
  setOpenPsalm: (n: number | null) => void;
  openOffice: RefOfficeId | null;
  setOpenOffice: (id: RefOfficeId | null) => void;
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

  const readingLabel =
    openPsalm !== null
      ? `Psalm ${openPsalm}`
      : openOffice !== null
        ? OFFICE_NAMES[openOffice]
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
  };

  return (
    <ReferenceContext.Provider value={state}>
      {children}
    </ReferenceContext.Provider>
  );
}

export function OfficesScreen() {
  const { tab, query, openPsalm, openOffice, setOpenPsalm, setOpenOffice } =
    useReference();

  return (
    <View style={styles.container}>
      {openPsalm !== null ? (
        <PsalmDetail psalm={openPsalm} />
      ) : openOffice !== null ? (
        <OfficeDetail officeId={openOffice} />
      ) : tab === "psalms" ? (
        <PsalmList query={query} onSelect={setOpenPsalm} />
      ) : tab === "collects" ? (
        <CollectList query={query} />
      ) : (
        <OfficeList onSelect={setOpenOffice} />
      )}
    </View>
  );
}

// the 30px reference bar, rendered by Shell above the content column.
export function ReferenceBar({ leading }: { leading?: ReactNode }) {
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
  } = ref;
  const detailOpen = openPsalm !== null || openOffice !== null;
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
            }}
          >
            <Text
              style={[styles.tabText, tab === t.id && styles.tabTextActive]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
        {detailOpen ? (
          <Pressable
            style={({ hovered }) => [
              styles.backBtn,
              hovered && styles.tabHover,
            ]}
            onPress={() => {
              setOpenPsalm(null);
              setOpenOffice(null);
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

function PsalmList({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (psalm: number) => void;
}) {
  const hits = searchPsalms(query);
  if (hits.length === 0) {
    return <EmptyMessage message={`No psalms match “${query}”.`} />;
  }
  return (
    <ScrollView style={styles.list}>
      {hits.map((hit) => (
        <Pressable
          key={hit.psalm}
          style={({ hovered }) => [styles.row, hovered && styles.rowHover]}
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
      ))}
    </ScrollView>
  );
}

function PsalmDetail({ psalm }: { psalm: number }) {
  const passage = useMemo(() => psalmPassage({ psalm }), [psalm]);
  const verses = passage?.verses.length ?? 0;
  return (
    <ScrollView style={styles.list}>
      <Text style={styles.detailTitle}>Psalm {psalm}</Text>
      <Text style={styles.detailSubtitle}>
        {verses} verse{verses === 1 ? "" : "s"}
      </Text>
      {passage ? <PsalmText passage={passage} /> : null}
    </ScrollView>
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

function OfficeList({ onSelect }: { onSelect: (id: RefOfficeId) => void }) {
  return (
    <ScrollView style={styles.list}>
      {OFFICE_IDS.map((id) => (
        <Pressable
          key={id}
          style={({ hovered }) => [styles.row, hovered && styles.rowHover]}
          onPress={() => onSelect(id)}
        >
          {({ hovered }) => (
            <View style={styles.rowInner}>
              <Text numberOfLines={1} style={styles.officeRowName}>
                {OFFICE_NAMES[id]}
              </Text>
              <View
                style={[styles.rowChevron, hovered && styles.rowChevronShown]}
              >
                <Chevron direction="right" size={5} />
              </View>
            </View>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

function OfficeDetail({ officeId }: { officeId: RefOfficeId }) {
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
    <ScrollView style={styles.list}>
      <Text style={styles.detailTitle}>{document.officeName}</Text>
      <Text style={styles.detailSubtitle}>
        as appointed for {dayLabel(document.date)}
      </Text>
      <OfficeView document={document} showRubrics showSpeakers />
    </ScrollView>
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
    height: 30,
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
    maxWidth: 240,
    minWidth: 120,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: SANS,
    fontSize: 11,
    color: "var(--text, #2c2020)",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  backText: {
    fontFamily: SANS,
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: 11,
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
    gap: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  rowMeta: {
    marginLeft: "auto",
    fontFamily: SANS,
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    fontVariant: ["tabular-nums"],
  },
  rowChevron: {
    opacity: 0,
  },
  rowChevronShown: {
    opacity: 1,
  },
  psalmNumber: {
    width: 34,
    textAlign: "right",
    fontFamily: SANS,
    fontSize: 13,
    fontWeight: "700",
    color: "var(--accent, #7a3040)",
    fontVariant: ["tabular-nums"],
  },
  incipit: {
    fontFamily: SERIF,
    fontSize: 14,
    color: "var(--text, #2c2020)",
    flex: 1,
  },
  empty: {
    fontFamily: SANS,
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    paddingVertical: 16,
  },
  detailTitle: {
    fontFamily: SERIF,
    fontSize: 26,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 4,
  },
  detailSubtitle: {
    fontFamily: SANS,
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 18,
  },
  collectGroup: {
    marginBottom: 22,
  },
  groupHeading: {
    fontFamily: SANS,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 8,
  },
  groupRule: {
    borderTopWidth: 1,
    borderTopColor: "var(--border-faint, rgba(127,127,127,0.14))",
    paddingTop: 10,
  },
  collectCard: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(127,127,127,0.14))",
  },
  collectTitle: {
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: "600",
    color: "var(--accent, #7a3040)",
    marginBottom: 3,
  },
  collectBody: {
    fontFamily: SERIF,
    fontSize: 15,
    lineHeight: 23,
    color: "var(--text, #2c2020)",
  },
  officeRowName: {
    fontFamily: SERIF,
    fontSize: 15,
    color: "var(--text, #2c2020)",
    flex: 1,
  },
});
