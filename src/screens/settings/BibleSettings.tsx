import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Chevron } from "../../components/shell/Chevron";
import {
  booksFor,
  clearSavedPositions,
  hasSavedPosition,
  useBible,
} from "../../context/BibleContext";
import { clearProgress, getAllProgress } from "../../lib/content/bibleProgress";
import {
  formatBytes,
  KJV_BOOK_SIZES,
  KJVA_BOOK_SIZES,
  type ScriptureBookSize,
  totalBytes,
  WEB_BOOK_SIZES,
} from "../../lib/content/scriptureSizes";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { APOCRYPHA_OPTIONS, TRANSLATION_OPTIONS } from "../../lib/translations";
import { OptionChips } from "./SettingsUi";
import { settingsStyles } from "./settingsStyles";

type BibleSettingsProps = {
  translation: "kjv" | "web";
  setTranslation: (t: "kjv" | "web") => void;
};

export function BibleSettingsPanel({
  translation,
  setTranslation,
}: BibleSettingsProps) {
  const styles = useThemedStyles(settingsStyles);
  // the corpus the reader has selected, and the switch that changes it. the
  // switch lives in the bible provider because it lands the reader on the
  // new corpus's own position, so the row means the same thing here as the
  // chip on the bar
  const { corpus, switchCorpus } = useBible();
  // storage is the source of truth; the counter is only ever bumped, so the
  // reset forces a fresh read below rather than caching a stale answer
  const [, reread] = useState(0);
  const marks = getAllProgress();
  // every chapter the reader can open in the corpus they have selected,
  // deuterocanonical included: reaching Sirach 40 is reading progress, so
  // it counts toward the same aggregate, and the total follows the corpus's
  // own book list
  const corpusBooks = booksFor(corpus);
  const books = [...corpusBooks.OT, ...corpusBooks.NT, ...corpusBooks.DC];
  const total = books.reduce((n, b) => n + b.chapters, 0);
  // clamped, so a stale mark can never push the total past a full bible
  const reached = books.reduce(
    (n, b) => n + Math.min(marks[b.abbrev] ?? 0, b.chapters),
    0,
  );
  // a position with no mark is an upgrading reader, so the reset stays live.
  // the gate spans both corpora, so a reader who read in the other one can
  // still clear it from here
  const hasProgress = reached > 0 || hasSavedPosition();
  const reset = () => {
    clearProgress();
    clearSavedPositions();
    reread((v) => v + 1);
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>Bible Translation</Text>
        <OptionChips
          options={TRANSLATION_OPTIONS}
          value={translation}
          onSelect={setTranslation}
          mono
        />
        <Text style={styles.settingDescription}>
          {TRANSLATION_OPTIONS.find((o) => o.id === translation)?.description}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Apocrypha</Text>
        <OptionChips
          options={APOCRYPHA_OPTIONS}
          value={corpus}
          onSelect={switchCorpus}
          mono
        />
        <Text style={styles.settingDescription}>
          {APOCRYPHA_OPTIONS.find((o) => o.id === corpus)?.description}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Scripture Data</Text>
        <Text style={styles.settingDescription}>
          Size of scripture included in the app.
        </Text>
        <View style={styles.dataGroups}>
          <TranslationGroup
            title="King James Version"
            sections={[
              {
                title: "Old Testament",
                items: KJV_BOOK_SIZES.filter((b) => b.testament === "OT"),
              },
              {
                title: "New Testament",
                items: KJV_BOOK_SIZES.filter((b) => b.testament === "NT"),
              },
              { title: "Apocrypha (KJVA)", items: KJVA_BOOK_SIZES },
            ]}
          />
          <TranslationGroup
            title="World English Bible"
            sections={[
              {
                title: "Old Testament",
                items: WEB_BOOK_SIZES.filter((b) => b.testament === "OT"),
              },
              {
                title: "New Testament",
                items: WEB_BOOK_SIZES.filter((b) => b.testament === "NT"),
              },
              {
                title: "Apocrypha (WEB)",
                items: WEB_BOOK_SIZES.filter((b) => b.testament === "DC"),
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Reading Progress</Text>
        <Text style={styles.value}>
          {`${Math.round((reached / total) * 100)}% · ${reached} of ${total} chapters reached`}
        </Text>
        <Text
          style={[
            styles.option,
            styles.resetBtn,
            !hasProgress && styles.optionDisabled,
          ]}
          onPress={reset}
          aria-disabled={!hasProgress}
        >
          Reset
        </Text>
        <Text style={styles.settingDescription}>
          Forgets which chapters you have reached and where you left off, so
          both start over.
        </Text>
      </View>
    </>
  );
}

type SizeSection = { title: string; items: ScriptureBookSize[] };

function TranslationGroup({
  title,
  sections,
}: {
  title: string;
  sections: SizeSection[];
}) {
  const styles = useThemedStyles(settingsStyles);
  const [open, setOpen] = useState(false);
  const allItems = sections.flatMap((section) => section.items);
  return (
    <View style={styles.dataGroup}>
      <Pressable
        style={({ hovered }) => [
          styles.dataGroupHeader,
          styles.dataGroupHeaderPressable,
          hovered && styles.dataGroupHeaderHover,
        ]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.dataGroupTitleRow}>
          <Chevron direction={open ? "down" : "right"} size={5} stroke={1.5} />
          <Text style={styles.dataGroupTitle}>{title}</Text>
        </View>
        <Text style={styles.dataGroupTotal}>
          {formatBytes(totalBytes(allItems))}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.dataList}>
          {sections.map((section) => (
            <View key={section.title} style={styles.dataRow}>
              <Text style={styles.dataName} numberOfLines={1}>
                {section.title}
              </Text>
              <Text style={styles.dataSize}>
                {formatBytes(totalBytes(section.items))}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
