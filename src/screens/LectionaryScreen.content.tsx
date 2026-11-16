import { useEffect, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import { useSectionHeading } from "../components/office/contentHeadings";
import { PsalmText } from "../components/office/PsalmText";
import { ScriptureView } from "../components/office/ScriptureView";
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
import { dayLabel } from "../lib/office";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { lectionaryStyles } from "./LectionaryScreen.styles";

const IS_WEB = Platform.OS === "web";

function LessonRow({ lesson }: { lesson: LectionaryLesson }) {
  const styles = useThemedStyles(lectionaryStyles);
  const { translation, apocrypha } = useTranslation();
  const [passages, setPassages] = useState<KjvPassage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPassages(null);
    getScripturePassagesFromDolRef({ translation, apocrypha }, lesson.ref).then(
      (ps) => {
        if (!cancelled) setPassages(ps);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [lesson.ref, translation, apocrypha]);

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
        passages.map((p) => {
          const first = p.verses[0]?.number;
          const last = p.verses[p.verses.length - 1]?.number;
          return (
            <ScriptureView
              key={`${p.book}-${p.chapter}-${first ?? "x"}-${last ?? "x"}`}
              passage={p}
              size="body"
            />
          );
        })
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
