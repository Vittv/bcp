import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  sanctoraleBySlug,
  sanctoraleDateLabel,
} from "../../lib/calendar/sanctorale";
import { collectPassage } from "../../lib/content/collects";
import { parsePsalmCitation } from "../../lib/content/psalms";
import { psalmPassage } from "../../lib/content/psalter";
import type { KjvPassage } from "../../lib/content/types";
import { getWebPassagesFromDolRef } from "../../lib/content/web";
import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_ITALIC_FONT,
} from "../../lib/fonts";
import { holyDayCollectTitle } from "../../lib/office/compose";
import { sectionHeading } from "./contentHeadings";
import { PsalmText } from "./PsalmText";
import { ScriptureView } from "./ScriptureView";

const RITE_LABELS: Record<string, string> = {
  traditional: "Traditional (Rite I)",
  contemporary: "Contemporary (Rite II)",
};

// a lesson citation. the card expands the passage inline with
// ScriptureView's own reference heading; refs that resolve across the
// combined canon (KJV for the OT/NT, WEB for the Apocrypha) render their
// text, others stay citation-only.
function LessonRow({ ref }: { ref: string }) {
  const [passages, setPassages] = useState<KjvPassage[]>([]);

  useEffect(() => {
    let cancelled = false;
    getWebPassagesFromDolRef(ref).then((ps) => {
      if (!cancelled) setPassages(ps);
    });
    return () => {
      cancelled = true;
    };
  }, [ref]);

  if (passages.length === 0) {
    return (
      <View style={styles.lessonRow}>
        <Text style={styles.lessonMissing}>{ref}</Text>
      </View>
    );
  }
  return (
    <View style={styles.lessonRow}>
      {passages.map((p) => (
        <ScriptureView key={`${p.book}-${p.chapter}`} passage={p} />
      ))}
    </View>
  );
}

// the shared card for a sanctorale entry: a biographical note by default,
// plus the liturgical content (psalms, lesson citations with inline KJV
// passages, and the day's collect in both rites) shown on demand. used by
// the Saints reference pane and the mention modal.
export function SanctoraleCard({
  slug,
  showTitle = true,
  showBio = true,
  showLiturgy = true,
}: {
  slug: string;
  showTitle?: boolean;
  /** render the biographical note. */
  showBio?: boolean;
  /** render the liturgical content: psalms, readings, collect. */
  showLiturgy?: boolean;
}) {
  const entry = sanctoraleBySlug(slug);
  if (!entry) return null;
  const feast = entry.eveOf ? sanctoraleBySlug(entry.eveOf) : undefined;
  const collectTitle = holyDayCollectTitle(slug);
  const traditional = collectTitle
    ? collectPassage("traditional", "holy-days", collectTitle)
    : undefined;
  const contemporary = collectTitle
    ? collectPassage("contemporary", "holy-days", collectTitle)
    : undefined;

  const psalmGroups: {
    label: string;
    citations: string[];
  }[] = [];
  if (entry.psalms.morning?.length)
    psalmGroups.push({
      label: "Morning",
      citations: entry.psalms.morning,
    });
  if (entry.psalms.evening?.length)
    psalmGroups.push({
      label: "Evening",
      citations: entry.psalms.evening,
    });

  const lessonGroups: { label: string; refs: string[] }[] = [];
  for (const [label, group] of [
    ["Morning", entry.lessons.morning],
    ["Evening", entry.lessons.evening],
  ] as const) {
    if (!group) continue;
    const refs = (["first", "second", "third", "gospel"] as const)
      .map((k) => group[k])
      .filter((r): r is string => typeof r === "string");
    if (refs.length > 0) lessonGroups.push({ label, refs });
  }

  return (
    <View>
      {showTitle ? <Text style={styles.detailTitle}>{entry.title}</Text> : null}
      <Text style={styles.detailSubtitle}>
        {sanctoraleDateLabel(entry)}
        {entry.eveOf ? ` · eve of ${feast?.title ?? entry.eveOf}` : ""}
      </Text>

      {showBio && entry.bio ? (
        <View style={styles.group}>
          <Text style={styles.bioText}>{entry.bio}</Text>
        </View>
      ) : null}

      {showLiturgy ? (
        <View>
          {psalmGroups.length > 0 ? (
            <View style={styles.group}>
              <Text style={sectionHeading}>Psalms</Text>
              {psalmGroups.map((group) => (
                <View key={group.label} style={styles.timeBlock}>
                  <Text style={styles.groupSubheading}>{group.label}</Text>
                  {group.citations.map((citation) => {
                    const parsed = parsePsalmCitation(citation);
                    const passage = parsed ? psalmPassage(parsed) : undefined;
                    return (
                      <View key={citation} style={styles.psalmBlock}>
                        <Text style={styles.psalmRef}>Psalm {citation}</Text>
                        {passage ? <PsalmText passage={passage} /> : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}

          {lessonGroups.length > 0 ? (
            <View style={styles.group}>
              <Text style={sectionHeading}>Readings</Text>
              {lessonGroups.map((group) => (
                <View key={group.label} style={styles.timeBlock}>
                  <Text style={styles.groupSubheading}>{group.label}</Text>
                  {group.refs.map((ref) => (
                    <LessonRow key={ref} ref={ref} />
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {traditional && contemporary ? (
            <View style={styles.group}>
              <Text style={sectionHeading}>Collect of the Day</Text>
              {collectTitle ? (
                <Text style={styles.collectTitle}>{collectTitle}</Text>
              ) : null}
              {[traditional, contemporary].map((c) => (
                <View key={c.rite} style={styles.collect}>
                  <Text style={styles.collectRite}>
                    {RITE_LABELS[c.rite] ?? c.rite}
                  </Text>
                  <Text style={styles.collectText}>{c.text}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 22,
  },
  // the time-of-day marker above a psalm or lesson group: same serif
  // italic paper-ink voice as the collect title, a touch larger than
  // body labels so the morning/evening split reads as a section heading.
  // no top margin, the block beneath it carries the separation
  groupSubheading: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 16,
    lineHeight: 24,
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  timeBlock: {
    marginBottom: 18,
  },
  psalmBlock: {
    marginTop: 16,
  },
  psalmRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 22,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 6,
  },
  lessonRow: {
    marginTop: 16,
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 16,
    lineHeight: 24,
    color: "var(--text-secondary, #7a6e64)",
  },
  // deuterocanonical readings (Sirach, Wisdom, 2 Esdras) have no KJV
  // text vendored yet; the citation stays, with a quiet notice instead
  // of a dangling label over empty space
  lessonMissing: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 13,
    lineHeight: 20,
    color: "var(--text-secondary, #7a6e64)",
    marginTop: 2,
  },
  collect: {
    marginBottom: 20,
  },
  // the collect's own title leads the block as a serif heading; ink
  // stays in the paper colour so it reads as text, not a link
  collectTitle: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 16,
    lineHeight: 24,
    color: "var(--text, #2c2020)",
    marginTop: 8,
    marginBottom: 12,
  },
  // the rite markers stay small and muted so "Collect of the Day" leads
  // the block; the red belongs to the section heading
  collectRite: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 4,
  },
  collectText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text, #2c2020)",
  },
  detailTitle: {
    fontFamily: HEADING_FONT,
    fontWeight: "700",
    fontSize: 30,
    lineHeight: 38,
    color: "var(--text, #2c2020)",
    marginBottom: 4,
  },
  detailSubtitle: {
    fontFamily: "var(--ui-font, system-ui)",
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 22,
  },
  // the biographical note leads the card, set in the same serif voice as
  // the collect so it reads as a printed life, not machine metadata
  bioText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text, #2c2020)",
  },
});
