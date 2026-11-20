import { useEffect, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import { useSectionHeading } from "../components/office/contentHeadings";
import { PsalmText } from "../components/office/PsalmText";
import { ScriptureView } from "../components/office/ScriptureView";
import { StickyHeading } from "../components/office/StickyHeading";
import { useTranslation } from "../context/TranslationContext";
import type { CalendarDate } from "../lib/calendar/types";
import {
  type Bcp1962ResolvedOffice,
  type Bcp1962ResolvedPassage,
  composeBcp1962ForDate,
  resolveBcp1962OfficeForDate,
} from "../lib/content/bcp1962";
import { getBcp1962PsalmPassage } from "../lib/content/vendor/bcp1962";
import { dayLabel } from "../lib/office";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { lectionaryStyles } from "./LectionaryScreen.styles";

const IS_WEB = Platform.OS === "web";

const OFFICE_LABEL = {
  morning: "Morning Prayer",
  evening: "Evening Prayer",
} as const;
const LESSON_LABEL = ["First Lesson", "Second Lesson"];

function LessonRow({
  lesson,
  label,
}: {
  lesson: Bcp1962ResolvedPassage;
  label: string;
}) {
  const styles = useThemedStyles(lectionaryStyles);
  return (
    <View style={styles.lesson}>
      <Text style={styles.lessonRef}>
        <Text style={styles.lessonLabel}>{label}: </Text>
        {lesson.ref}
      </Text>
      {lesson.ranges
        ?.filter((range) => range.optional)
        .map((range) => (
          <Text key={`alt-${range.ref}`} style={styles.officeNote}>
            Alternative appointed in parentheses: {range.ref}
          </Text>
        ))}
      {lesson.ranges
        ?.filter((range) => range.half)
        .map((range) => (
          <Text key={`half-${range.ref}`} style={styles.officeNote}>
            Verse half as printed: {range.ref}
          </Text>
        ))}
      {lesson.passages.length === 0 ? (
        <Text style={styles.lessonMissing}>
          {lesson.error ?? "Reading text not available"}
        </Text>
      ) : (
        lesson.passages.map((p) => {
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

function PsalmsBlock({ refs }: { refs: string[] }) {
  const styles = useThemedStyles(lectionaryStyles);
  if (refs.length === 0) return null;
  return (
    <View style={styles.psalmBlock}>
      {refs.map((ref, i) => {
        const passage = getBcp1962PsalmPassage(ref);
        return (
          <View key={ref} style={i === 0 ? undefined : styles.psalmItem}>
            <Text style={styles.psalmRef}>Psalm {ref}</Text>
            {passage ? <PsalmText passage={passage} size="body" /> : null}
          </View>
        );
      })}
    </View>
  );
}

function OfficeBlock({ office }: { office: Bcp1962ResolvedOffice }) {
  const heading = useSectionHeading();
  return (
    <View>
      <StickyHeading sticky>
        <Text style={heading}>{OFFICE_LABEL[office.office]}</Text>
      </StickyHeading>
      <PsalmsBlock refs={office.psalms ?? []} />
      {office.lessons.map((lesson, i) => (
        <LessonRow
          key={lesson.ref}
          lesson={lesson}
          label={LESSON_LABEL[i] ?? "Lesson"}
        />
      ))}
    </View>
  );
}

type Offices = {
  morning?: Bcp1962ResolvedOffice;
  evening?: Bcp1962ResolvedOffice;
};

export function Lectionary1962Screen({ date }: { date: CalendarDate }) {
  const styles = useThemedStyles(lectionaryStyles);
  const { translation, apocrypha } = useTranslation();
  const [offices, setOffices] = useState<Offices>({});
  const composed = composeBcp1962ForDate(date);
  const title = composed.name;

  useEffect(() => {
    let cancelled = false;
    setOffices({});
    const settings = { translation, apocrypha };
    Promise.all([
      resolveBcp1962OfficeForDate(date, "morning", settings),
      resolveBcp1962OfficeForDate(date, "evening", settings),
    ]).then(([morning, evening]) => {
      if (!cancelled) setOffices({ morning, evening });
    });
    return () => {
      cancelled = true;
    };
  }, [date, translation, apocrypha]);

  const inner = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Readings</Text>
        <Text style={styles.dateLabel}>{dayLabel(date)}</Text>
        {composed.notes.map((note) => (
          <Text key={note} style={styles.officeNote}>
            {note}
          </Text>
        ))}
        {title ? <Text style={styles.properTitle}>{title}</Text> : null}
      </View>
      {offices.morning ? <OfficeBlock office={offices.morning} /> : null}
      {offices.evening ? <OfficeBlock office={offices.evening} /> : null}
    </>
  );

  if (IS_WEB) return inner;
  return <ScrollView>{inner}</ScrollView>;
}
