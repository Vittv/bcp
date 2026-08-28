import { useDeferredValue, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type TextInput,
  View,
} from "react-native";
import type { PageId } from "../../components/shell/Sidebar";
import { useBible } from "../../context/BibleContext";
import { useNavigation } from "../../context/NavigationContext";
import { getKjvBookMeta } from "../../lib/content/kjv";
import { CHROME_FONT } from "../../lib/fonts";
import { type GlobalHit, globalSearch } from "../../lib/reference/search";
import { useReference } from "../../screens/reference/shared";
import { SearchField } from "./SearchField";

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

type SearchHandle = {
  focus: () => void;
  clear: () => void;
};

let registeredHandle: SearchHandle | null = null;

export function focusGlobalSearch(): void {
  registeredHandle?.focus();
}

export function clearGlobalSearch(): void {
  registeredHandle?.clear();
}

function registerGlobalSearch(handle: SearchHandle | null): void {
  registeredHandle = handle;
}

type BiblePage = Extract<PageId, "old-testament" | "new-testament">;

function bibleHitPage(abbrev: string): BiblePage {
  return getTestament(abbrev);
}

function getTestament(abbrev: string): BiblePage {
  return getKjvBookMeta(abbrev)?.testament === "NT"
    ? "new-testament"
    : "old-testament";
}

export function GlobalSearch() {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<GlobalHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const deferred = useDeferredValue(value);
  const { setOpenPsalm, setSelectedCollect } = useReference();
  const bible = useBible();
  const { navigateTo } = useNavigation();

  useEffect(() => {
    registerGlobalSearch({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        setValue("");
        setResults(null);
        inputRef.current?.blur();
      },
    });
    return () => registerGlobalSearch(null);
  }, []);

  const active = value.trim().length > 0;

  useEffect(() => {
    if (!deferred.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    globalSearch(deferred).then((hits) => {
      if (cancelled) return;
      setResults(hits);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [deferred]);

  const open = (hit: GlobalHit) => {
    if (hit.kind === "psalm") {
      setOpenPsalm(hit.psalm);
      navigateTo("psalms");
    } else if (hit.kind === "collect") {
      setSelectedCollect({ section: hit.section, title: hit.title });
      navigateTo("collects");
    } else {
      bible.goToRef(hit.bible.abbrev, hit.bible.chapter);
      navigateTo(bibleHitPage(hit.bible.abbrev));
    }
    setValue("");
    setResults(null);
    inputRef.current?.blur();
  };

  const close = () => {
    setValue("");
    setResults(null);
  };

  return (
    <View style={[styles.wrap, noSelect]}>
      <SearchField
        ref={inputRef}
        value={value}
        onChangeText={setValue}
        placeholder="Search"
        accessibilityLabel="Global search"
        shortcut
        onClear={close}
      />
      {active ? (
        <View style={styles.results}>
          <View style={styles.resultsScroll}>
            {loading && results === null ? (
              <Text style={styles.empty}>Searching…</Text>
            ) : results === null || results.length === 0 ? (
              <Text style={styles.empty}>No results for “{deferred}”.</Text>
            ) : (
              results.map((hit) => (
                <ResultRow
                  key={rowKey(hit)}
                  hit={hit}
                  onPress={() => open(hit)}
                />
              ))
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function rowKey(hit: GlobalHit): string {
  if (hit.kind === "psalm") return `p${hit.psalm}`;
  if (hit.kind === "collect") return `c${hit.section}:${hit.title}`;
  return `b${hit.bible.abbrev}:${hit.bible.chapter}:${hit.bible.verse}`;
}

function ResultRow({ hit, onPress }: { hit: GlobalHit; onPress: () => void }) {
  let title: string;
  let subtitle: string;
  if (hit.kind === "psalm") {
    title = `Psalm ${hit.psalm}`;
    subtitle = hit.incipit || (hit.snippet ?? "");
  } else if (hit.kind === "collect") {
    title = hit.title;
    subtitle = hit.snippet ?? "Collect";
  } else {
    title = `${hit.bible.book} ${hit.bible.chapter}:${hit.bible.verse}`;
    subtitle = hit.bible.snippet;
  }
  return (
    <Pressable
      style={({ hovered }) => [styles.result, hovered && styles.resultHover]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text numberOfLines={1} style={styles.resultTitle}>
        {title}
      </Text>
      {subtitle ? (
        <Text numberOfLines={1} style={styles.resultSnippet}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "var(--bg, #e0dbd0)",
    zIndex: 50,
  },
  results: {
    position: "absolute",
    top: "100%",
    left: 8,
    right: 8,
    marginTop: 4,
    maxHeight: 320,
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg-raised, #ece7dd)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  resultsScroll: {
    maxHeight: 320,
    overflowY: "auto",
    overflowX: "hidden",
  },
  empty: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  result: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(44, 32, 32, 0.09))",
  },
  resultHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  resultTitle: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 13,
    color: "var(--text, #2c2020)",
  },
  resultSnippet: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
    marginTop: 2,
  },
});
