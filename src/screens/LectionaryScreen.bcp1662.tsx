import { useEffect, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import { useSectionHeading } from "../components/office/contentHeadings";
import { PsalmText } from "../components/office/PsalmText";
import { ScriptureView } from "../components/office/ScriptureView";
import { StickyHeading } from "../components/office/StickyHeading";
import { useTranslation } from "../context/TranslationContext";
import type { CalendarDate } from "../lib/calendar/types";
import {
  type Bcp1662ResolvedOffice,
  type Bcp1662ResolvedPassage,
  composeBcp1662ForDate,
  resolveBcp1662OfficeForDate,
} from "../lib/content/bcp1662";
import { getBcp1662PsalmPassage } from "../lib/content/vendor/bcp1662";
import { dayLabel } from "../lib/office";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { lectionaryStyles } from "./LectionaryScreen.styles";

const IS_WEB = Platform.OS === "web";

const OFFICE_LABEL = { morning: "Matins", evening: "Evensong" } as const;
const LESSON_LABEL = ["First Lesson", "Second Lesson"];

function LessonRow({
  lesson,
  label,
}: {
  lesson: Bcp1662ResolvedPassage;
  label: string;
}) {
  const styles = useThemedStyles(lectionaryStyles);
  return (
    <View style={styles.lesson}>
      <Text style={styles.lessonRef}>
        <Text style={styles.lessonLabel}>{label}: </Text>
        {lesson.ref}
      </Text>
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
        const passage = getBcp1662PsalmPassage(ref);
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

function OfficeBlock({ office }: { office: Bcp1662ResolvedOffice }) {
  const heading = useSectionHeading();
  const psalms = office.psalms?.map(String) ?? office.monthlyPsalms ?? [];
  return (
    <View>
      <StickyHeading sticky>
        <Text style={heading}>{OFFICE_LABEL[office.office]}</Text>
      </StickyHeading>
      <PsalmsBlock refs={psalms} />
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
  morning?: Bcp1662ResolvedOffice;
  evening?: Bcp1662ResolvedOffice;
};

export function Lectionary1662Screen({ date }: { date: CalendarDate }) {
  const styles = useThemedStyles(lectionaryStyles);
  const { translation, apocrypha } = useTranslation();
  const [offices, setOffices] = useState<Offices>({});
  const composed = composeBcp1662ForDate(date);
  const title =
    composed.sundayProper?.name ??
    composed.holyDayProper?.name ??
    composed.daily?.resolvedFeastName;

  useEffect(() => {
    let cancelled = false;
    setOffices({});
    const settings = { translation, apocrypha };
    Promise.all([
      resolveBcp1662OfficeForDate(date, "morning", settings),
      resolveBcp1662OfficeForDate(date, "evening", settings),
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
