import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTranslation } from "../../context/TranslationContext";
import { calendarLabel } from "../../lib/calendar/feastsByTradition";
import {
  wikipediaArticleUrl,
  wikipediaSearchUrl,
} from "../../lib/calendar/lesserFeastWiki";
import {
  sanctoraleBySlug,
  sanctoraleDateLabel,
} from "../../lib/calendar/sanctorale";
import { SANCTORALE_WIKI } from "../../lib/calendar/sanctoraleWiki";
import { getScripturePassagesFromDolRef } from "../../lib/content/bible";
import { collectPassage } from "../../lib/content/collects";
import { parsePsalmCitation } from "../../lib/content/psalms";
import { psalmPassage } from "../../lib/content/psalter";
import type { KjvPassage } from "../../lib/content/types";
import { holyDayCollectTitle } from "../../lib/office/compose";
import { openExternal } from "../../lib/openExternal";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { useSectionHeading, useSubheading } from "./contentHeadings";
import { PsalmText } from "./PsalmText";
import { RITE_LABELS, sanctoraleCardStyles } from "./SanctoraleCard.styles";
import { ScriptureView } from "./ScriptureView";

// a lesson citation. the card expands the passage inline with
// ScriptureView's own reference heading; refs that resolve across the
// combined canon render their text, others stay citation-only.
function LessonRow({ ref, first }: { ref: string; first?: boolean }) {
  const styles = useThemedStyles(sanctoraleCardStyles);
  const { translation, apocrypha } = useTranslation();
  const [passages, setPassages] = useState<KjvPassage[]>([]);

  useEffect(() => {
    let cancelled = false;
    getScripturePassagesFromDolRef({ translation, apocrypha }, ref).then(
      (ps) => {
        if (!cancelled) setPassages(ps);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [ref, translation, apocrypha]);

  const row = [styles.lessonRow, first && styles.blockFirst];
  if (passages.length === 0) {
    return (
      <View style={row}>
        <Text style={styles.lessonMissing}>{ref}</Text>
      </View>
    );
  }
  return (
    <View style={row}>
      {passages.map((p) => {
        const first = p.verses[0]?.number;
        const last = p.verses[p.verses.length - 1]?.number;
        return (
          <ScriptureView
            key={`${p.book}-${p.chapter}-${first ?? "x"}-${last ?? "x"}`}
            passage={p}
          />
        );
      })}
    </View>
  );
}

// the shared card for a sanctorale entry: a biographical note by default,
// plus the liturgical content (psalms, lesson citations with inline
// scripture passages, and the day's collect in both rites) shown on demand.
// used by the Saints reference pane and the mention modal.
export function SanctoraleCard({
  slug,
  calendar = calendarLabel("tec"),
  showTitle = true,
  showBio = true,
  showLiturgy = true,
}: {
  slug: string;
  /** the church and book to name under the title. */
  calendar?: string;
  showTitle?: boolean;
  /** render the biographical note. */
  showBio?: boolean;
  /** render the liturgical content: psalms, readings, collect. */
  showLiturgy?: boolean;
}) {
  const styles = useThemedStyles(sanctoraleCardStyles);
  const heading = useSectionHeading();
  const subheading = useSubheading();
  const entry = sanctoraleBySlug(slug);
  if (!entry) return null;
  const feast = entry.eveOf ? sanctoraleBySlug(entry.eveOf) : undefined;
  const wikiLinks = SANCTORALE_WIKI[slug] ?? [];
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
        {showTitle ? `${calendar}\n` : null}
        {sanctoraleDateLabel(entry)}
        {entry.eveOf ? ` · eve of ${feast?.title ?? entry.eveOf}` : ""}
      </Text>

      {showBio && entry.bio ? (
        <View style={styles.group}>
          <Text style={styles.bioText}>{entry.bio}</Text>
          {wikiLinks.length > 0 ? (
            wikiLinks.map((link) => (
              <Pressable
                key={link.title}
                style={styles.linkRow}
                onPress={() => openExternal(wikipediaArticleUrl(link.title))}
                accessibilityRole="link"
                accessibilityLabel={`Read ${link.label ?? link.title} on Wikipedia`}
              >
                {({ hovered }) => (
                  <Text style={[styles.link, hovered && styles.linkHover]}>
                    {`${link.label ?? link.title} on Wikipedia`}
                  </Text>
                )}
              </Pressable>
            ))
          ) : (
            <Pressable
              style={styles.linkRow}
              onPress={() => openExternal(wikipediaSearchUrl(entry.title))}
              accessibilityRole="link"
              accessibilityLabel={`Search Wikipedia for ${entry.title}`}
            >
              {({ hovered }) => (
                <Text style={[styles.link, hovered && styles.linkHover]}>
                  Search Wikipedia
                </Text>
              )}
            </Pressable>
          )}
        </View>
      ) : null}

      {showLiturgy ? (
        <View>
          {psalmGroups.length > 0 ? (
            <View style={styles.group}>
              <Text style={heading}>Psalms</Text>
              <View style={styles.timeGroups}>
                {psalmGroups.map((group) => (
                  <View key={group.label}>
                    <Text style={[subheading, styles.timeLabel]}>
                      {group.label}
                    </Text>
                    {group.citations.map((citation, i) => {
                      const parsed = parsePsalmCitation(citation);
                      const passage = parsed ? psalmPassage(parsed) : undefined;
                      return (
                        <View
                          key={citation}
                          style={[
                            styles.psalmBlock,
                            i === 0 && styles.blockFirst,
                          ]}
                        >
                          <Text style={styles.psalmRef}>Psalm {citation}</Text>
                          {passage ? <PsalmText passage={passage} /> : null}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {lessonGroups.length > 0 ? (
            <View style={styles.group}>
              <Text style={heading}>Readings</Text>
              <View style={styles.timeGroups}>
                {lessonGroups.map((group) => (
                  <View key={group.label}>
                    <Text style={[subheading, styles.timeLabel]}>
                      {group.label}
                    </Text>
                    {group.refs.map((ref, i) => (
                      <LessonRow key={ref} ref={ref} first={i === 0} />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {traditional && contemporary ? (
            <View style={styles.group}>
              <Text style={heading}>Collect of the Day</Text>
              {collectTitle ? (
                <Text style={[subheading, styles.collectTitleAsSubheading]}>
                  {collectTitle}
                </Text>
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
