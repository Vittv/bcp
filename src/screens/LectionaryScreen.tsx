import { type ReactNode, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { sectionHeading } from "../components/office/contentHeadings";
import { PsalmText } from "../components/office/PsalmText";
import { ScriptureView } from "../components/office/ScriptureView";
import { Chevron } from "../components/shell/Chevron";
import type { CalendarDate } from "../lib/calendar/types";
import { lectionaryForDate } from "../lib/content";
import type {
  LectionaryLesson,
  LectionaryOffice,
} from "../lib/content/lectionary";
import { parsePsalmCitation } from "../lib/content/psalms";
import { psalmPassage } from "../lib/content/psalter";
import type { KjvPassage } from "../lib/content/types";
import { getWebPassagesFromDolRef } from "../lib/content/web";
import { CHROME_FONT } from "../lib/fonts";
import { dayLabel } from "../lib/office";
import { noSelect } from "./reference/shared";
import { sharedStyles } from "./reference/styles";

const IS_WEB = Platform.OS === "web";

const SERIF_SEMI =
  '"Crimson Pro SemiBold", "Crimson Pro", Georgia, "Times New Roman", serif';
const SERIF_ITALIC =
  '"Crimson Pro Italic", "Crimson Pro", Georgia, "Times New Roman", serif';

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
  return (
    <View style={[sharedStyles.bar, noSelect]}>
      <View style={sharedStyles.barLeft}>{leading}</View>
      <View style={sharedStyles.barRight}>
        <Pressable
          style={({ hovered }) => [
            styles.dayBtn,
            hovered && sharedStyles.rowHover,
          ]}
          onPress={onPrevDate}
          accessibilityLabel="Previous day"
          accessibilityRole="button"
        >
          <Chevron direction="left" size={5} />
          <Text style={styles.dayBtnText}>Prev</Text>
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.dayBtn,
            hovered && sharedStyles.rowHover,
          ]}
          onPress={onNextDate}
          accessibilityLabel="Next day"
          accessibilityRole="button"
        >
          <Text style={styles.dayBtnText}>Next</Text>
          <Chevron direction="right" size={5} />
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.dayBtn,
            hovered && sharedStyles.rowHover,
            isToday && styles.dayBtnDim,
          ]}
          onPress={onToday}
          disabled={isToday}
          accessibilityLabel="Today"
          accessibilityRole="button"
        >
          <Text style={[styles.dayBtnText, isToday && styles.dayBtnTextDim]}>
            Today
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function LessonRow({ lesson }: { lesson: LectionaryLesson }) {
  const [passages, setPassages] = useState<KjvPassage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPassages(null);
    getWebPassagesFromDolRef(lesson.ref).then((ps) => {
      if (!cancelled) setPassages(ps);
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.ref]);

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
          <ScriptureView key={`${p.book}-${p.chapter}`} passage={p} />
        ))
      )}
    </View>
  );
}

function PsalmsBlock({ citations }: { citations: string[] }) {
  if (citations.length === 0) return null;
  return (
    <View style={styles.psalmBlock}>
      <Text style={styles.psalmRef}>
        Psalm{citations.length > 1 ? "s" : ""} {citations.join(", ")}
      </Text>
      {citations.map((citation, i) => {
        const parsed = parsePsalmCitation(citation);
        const passage = parsed ? psalmPassage(parsed) : undefined;
        if (!passage) return null;
        return (
          <View
            key={citation}
            style={i === 0 ? undefined : styles.psalmItem}
          >
            <PsalmText passage={passage} />
          </View>
        );
      })}
    </View>
  );
}

function OfficeBlock({ office }: { office: LectionaryOffice }) {
  return (
    <View style={styles.group}>
      <Text style={sectionHeading}>{office.label}</Text>
      <PsalmsBlock citations={office.psalms} />
      {office.lessons.map((lesson) => (
        <LessonRow key={lesson.ref} lesson={lesson} />
      ))}
    </View>
  );
}

export function LectionaryScreen({ date }: { date: CalendarDate }) {
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
          <View style={styles.group}>
            <Text style={sectionHeading}>Morning Psalms</Text>
            <PsalmsBlock citations={day.psalms.morning} />
          </View>
          <View style={styles.group}>
            <Text style={sectionHeading}>Readings</Text>
            {day.lessons.map((lesson) => (
              <LessonRow key={lesson.ref} lesson={lesson} />
            ))}
          </View>
          <View style={styles.group}>
            <Text style={sectionHeading}>Evening Psalms</Text>
            <PsalmsBlock citations={day.psalms.evening} />
          </View>
        </>
      ) : null}
    </>
  );

  if (IS_WEB) return inner;
  return <ScrollView>{inner}</ScrollView>;
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content, #b5aa9e)",
  },
  title: {
    fontFamily: SERIF_SEMI,
    fontSize: 28,
    lineHeight: 36,
    color: "var(--text, #2c2020)",
    letterSpacing: -0.3,
  },
  dateLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    marginTop: 4,
  },
  entryTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginTop: 8,
  },
  group: {
    marginBottom: 22,
  },
  psalmBlock: {
    paddingLeft: 4,
  },
  psalmItem: {
    marginTop: 14,
  },
  psalmRef: {
    fontFamily: SERIF_ITALIC,
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 6,
  },
  lesson: {
    marginTop: 22,
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC,
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
  },
  lessonLabel: {
    color: "var(--accent, #7a3040)",
  },
  lessonMissing: {
    fontFamily: SERIF_ITALIC,
    fontSize: 13,
    lineHeight: 20,
    color: "var(--text-secondary, #7a6e64)",
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
    color: "var(--text-secondary, #7a6e64)",
  },
  dayBtnDim: {
    opacity: 0.45,
  },
  dayBtnTextDim: {
    color: "var(--text-tertiary, #a89c90)",
  },
});
