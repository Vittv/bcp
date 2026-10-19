import { type ReactNode, useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSectionHeading } from "../components/office/contentHeadings";
import { PsalmText } from "../components/office/PsalmText";
import { ScriptureView } from "../components/office/ScriptureView";
import { Chevron } from "../components/shell/Chevron";
import { useTranslation } from "../context/TranslationContext";
import type { CalendarDate } from "../lib/calendar/types";
import { lectionaryForDate } from "../lib/content";
import { getScripturePassagesFromDolRef } from "../lib/content/bible";
import type {
  LectionaryLesson,
  LectionaryOffice,
} from "../lib/content/lectionary";
import { parsePsalmCitation } from "../lib/content/psalms";
import { psalmPassage } from "../lib/content/psalter";
import type { KjvPassage } from "../lib/content/types";
import { CHROME_FONT, HEADING_FONT, SERIF_ITALIC_FONT } from "../lib/fonts";
import { dayLabel } from "../lib/office";
import { defineThemedStyles, useThemedStyles } from "../lib/theme/themedStyles";
import { noSelect } from "./reference/shared";
import { sharedStyles } from "./reference/styles";

const IS_WEB = Platform.OS === "web";

export function LectionaryBar({
  leading,
  isToday,
  onPrevDate,
  onNextDate,
  onToday,
}: {
  leading?: ReactNode;
  isToday: boolean;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
}) {
  const barStyles = useThemedStyles(sharedStyles);
  const styles = useThemedStyles(lectionaryStyles);
  return (
    <View style={[barStyles.bar, noSelect]}>
      <View style={barStyles.barLeft}>{leading}</View>
      <View style={barStyles.barRight}>
        <Pressable
          style={({ hovered }) => [
            styles.dayBtn,
            hovered && barStyles.rowHover,
          ]}
          onPress={onToday}
          disabled={isToday}
          accessibilityLabel="Today"
          accessibilityRole="button"
        >
          <Text style={[styles.dayBtnText, isToday && styles.dayBtnTextActive]}>
            Today
          </Text>
        </Pressable>
        {/* day arrows reusing the scripture sections' square arrow buttons */}
        <Pressable
          style={({ hovered }) => [
            barStyles.arrowBtn,
            hovered && barStyles.arrowBtnHover,
          ]}
          onPress={onPrevDate}
          accessibilityLabel="Previous day"
          accessibilityRole="button"
        >
          <Chevron direction="left" size={6} />
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            barStyles.arrowBtn,
            hovered && barStyles.arrowBtnHover,
          ]}
          onPress={onNextDate}
          accessibilityLabel="Next day"
          accessibilityRole="button"
        >
          <Chevron direction="right" size={6} />
        </Pressable>
      </View>
    </View>
  );
}

function LessonRow({ lesson }: { lesson: LectionaryLesson }) {
  const styles = useThemedStyles(lectionaryStyles);
  const { translation } = useTranslation();
  const [passages, setPassages] = useState<KjvPassage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPassages(null);
    getScripturePassagesFromDolRef(translation, lesson.ref).then((ps) => {
      if (!cancelled) setPassages(ps);
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.ref, translation]);

  return (
    <View style={styles.lesson}>
      <Text style={styles.lessonRef}>
        <Text style={styles.lessonLabel}>{lesson.label}: </Text>
        {lesson.ref}
      </Text>
      {passages === null ? (
        <Text style={styles.lessonMissing}>Loading…</Text>
      ) : passages.length === 0 ? (
        <Text style={styles.lessonMissing}>Reading text not available</Text>
      ) : (
        passages.map((p) => (
          <ScriptureView
            key={`${p.book}-${p.chapter}`}
            passage={p}
            size="body"
          />
        ))
      )}
    </View>
  );
}

// each psalm is its own labeled block the way lessons are: the citation
// line ("Psalm 20") leads, the psalm text follows underneath.
function PsalmsBlock({ citations }: { citations: string[] }) {
  const styles = useThemedStyles(lectionaryStyles);
  if (citations.length === 0) return null;
  return (
    <View style={styles.psalmBlock}>
      {citations.map((citation, i) => {
        const parsed = parsePsalmCitation(citation);
        const passage = parsed ? psalmPassage(parsed) : undefined;
        return (
          <View key={citation} style={i === 0 ? undefined : styles.psalmItem}>
            <Text style={styles.psalmRef}>Psalm {citation}</Text>
            {passage ? <PsalmText passage={passage} size="body" /> : null}
          </View>
        );
      })}
    </View>
  );
}

function OfficeBlock({ office }: { office: LectionaryOffice }) {
  const heading = useSectionHeading();
  return (
    <View>
      <Text style={heading}>{office.label}</Text>
      <PsalmsBlock citations={office.psalms} />
      {office.lessons.map((lesson) => (
        <LessonRow key={lesson.ref} lesson={lesson} />
      ))}
    </View>
  );
}

export function LectionaryScreen({ date }: { date: CalendarDate }) {
  const styles = useThemedStyles(lectionaryStyles);
  const heading = useSectionHeading();
  const day = lectionaryForDate(date);
  const inner = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Readings</Text>
        <Text style={styles.dateLabel}>{dayLabel(date)}</Text>
        {day?.entry.title ? (
          <Text style={styles.entryTitle}>{day.entry.title}</Text>
        ) : null}
      </View>
      {day?.kind === "split" ? (
        <>
          <OfficeBlock office={day.morning} />
          <OfficeBlock office={day.evening} />
        </>
      ) : day?.kind === "shared" ? (
        <>
          <View>
            <Text style={heading}>Morning Psalms</Text>
            <PsalmsBlock citations={day.psalms.morning} />
          </View>
          <View>
            <Text style={heading}>Readings</Text>
            {day.lessons.map((lesson) => (
              <LessonRow key={lesson.ref} lesson={lesson} />
            ))}
          </View>
          <View>
            <Text style={heading}>Evening Psalms</Text>
            <PsalmsBlock citations={day.psalms.evening} />
          </View>
        </>
      ) : null}
    </>
  );

  if (IS_WEB) return inner;
  return <ScrollView>{inner}</ScrollView>;
}

const lectionaryStyles = defineThemedStyles({
  header: {
    marginBottom: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 28,
    lineHeight: 36,
    color: "var(--text)",
    letterSpacing: -0.3,
  },
  dateLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  entryTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--accent)",
    marginTop: 8,
  },
  psalmBlock: {
    marginBottom: 22,
    paddingLeft: 4,
  },
  psalmItem: {
    marginTop: 14,
  },
  psalmRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  lesson: {
    marginBottom: 22,
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
  },
  lessonLabel: {
    color: "var(--accent)",
  },
  lessonMissing: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 13,
    lineHeight: 20,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  dayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  dayBtnText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  // when the viewed day is today, the button reads as the active day like
  // the calendar's Today control instead of a disabled dim
  dayBtnTextActive: {
    color: "var(--accent)",
    fontWeight: "600",
  },
});
