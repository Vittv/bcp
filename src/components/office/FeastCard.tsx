import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "../../context/TranslationContext";
import type { FeastIdentity } from "../../lib/calendar/feastsByTradition";
import {
  CHURCH_CALENDARS,
  feastMonthDayLabel,
  observationForTradition,
} from "../../lib/calendar/feastsByTradition";
import { LESSER_FEAST_BIOS } from "../../lib/calendar/lesserFeastBios";
import {
  LESSER_FEAST_WIKI,
  wikipediaArticleUrl,
  wikipediaSearchUrl,
} from "../../lib/calendar/lesserFeastWiki";
import { OLDER_FEAST_BIOS } from "../../lib/calendar/olderFeastBios";
import { OLDER_FEAST_WIKI } from "../../lib/calendar/olderFeastWiki";
import { SANCTORALE_BIOS } from "../../lib/calendar/sanctoraleBios";
import { SANCTORALE_WIKI } from "../../lib/calendar/sanctoraleWiki";
import type { CalendarTradition } from "../../lib/calendar/tradition";
import { getScripturePassagesFromDolRef } from "../../lib/content/bible";
import { appointmentInCollectTitle } from "../../lib/content/collects";
import { propersForFeast } from "../../lib/content/feastPropers";
import { parsePsalmCitation } from "../../lib/content/psalms";
import { psalmPassage } from "../../lib/content/psalter";
import type { KjvPassage, PsalmPassage } from "../../lib/content/types";
import { getBcp1662PsalmPassage } from "../../lib/content/vendor/bcp1662";
import {
  getBcp1962PsalmPassages,
  parseBcp1962PsalmAppointment,
} from "../../lib/content/vendor/bcp1962";
import { openExternal } from "../../lib/openExternal";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSectionHeading, useSubheading } from "./contentHeadings";
import { PsalmText } from "./PsalmText";
import { sanctoraleCardStyles } from "./SanctoraleCard.styles";
import { ScriptureView } from "./ScriptureView";
import { StickyHeading } from "./StickyHeading";

const TEC_HOLY_DAY_LINK = {
  label:
    "1979 Book of Common Prayer, Calendar of the Church Year, official PDF",
  url: "https://www.episcopalchurch.org/wp-content/uploads/2019/11/bcp_compressed.pdf",
};

const BOOK_LINK: Record<CalendarTradition, { label: string; url: string }> = {
  tec: {
    label: "The Episcopal Church Lesser Feasts and Fasts 2024, official PDF",
    url: "https://www.episcopalchurch.org/resources/lesser-feasts-and-fasts-english/",
  },
  coe: {
    label: "1662 Book of Common Prayer Calendar, official PDF",
    url: "https://www.churchofengland.org/sites/default/files/2026-10/bcp-the-calendar.pdf",
  },
  acc: {
    label: "1962 Anglican Church of Canada BCP Calendar, official PDF",
    url: "https://www.anglican.ca/wp-content/uploads/bcp.pdf#page=9",
  },
};

function WikiLinks({ name, slug }: { name: string; slug: string }) {
  const styles = useThemedStyles(sanctoraleCardStyles);
  const article =
    SANCTORALE_WIKI[slug] ??
    LESSER_FEAST_WIKI[slug] ??
    OLDER_FEAST_WIKI[slug] ??
    [];
  if (article.length === 0) {
    return (
      <Pressable
        style={styles.linkRow}
        onPress={() => openExternal(wikipediaSearchUrl(name))}
        accessibilityRole="link"
        accessibilityLabel={`Search Wikipedia for ${name}`}
      >
        {({ hovered }) => (
          <Text style={[styles.link, hovered && styles.linkHover]}>
            Search Wikipedia
          </Text>
        )}
      </Pressable>
    );
  }
  return (
    <>
      {article.map((link) => (
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
      ))}
    </>
  );
}

// citations clear the section rule by the same small margin the lectionary
// uses, without changing the shared card styles other surfaces rely on
const feastStyles = defineThemedStyles({
  citation: { marginTop: 8 },
});

// a psalm appointment resolved through the selected church's psalter. refs
// that cannot be read stay visible as citations rather than vanishing.
function PsalmRow({
  ref,
  tradition,
}: {
  ref: string;
  tradition: CalendarTradition;
}) {
  const styles = useThemedStyles(sanctoraleCardStyles);
  const feast = useThemedStyles(feastStyles);
  const passages: PsalmPassage[] = [];
  if (tradition === "tec") {
    const parsed = parsePsalmCitation(ref);
    const passage = parsed ? psalmPassage(parsed) : undefined;
    if (passage) passages.push(passage);
  } else if (tradition === "coe") {
    const passage = getBcp1662PsalmPassage(ref);
    if (passage) passages.push(passage);
  } else {
    passages.push(
      ...getBcp1962PsalmPassages(parseBcp1962PsalmAppointment(ref)),
    );
  }
  if (passages.length === 0) {
    return (
      <Text style={[styles.lessonMissing, feast.citation]}>Psalm {ref}</Text>
    );
  }
  return (
    <View style={[styles.psalmBlock, feast.citation]}>
      {passages.map((passage, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: an appointment can name the same psalm twice
          key={`${passage.psalm}-${i}`}
        >
          <Text style={styles.psalmRef}>{`Psalm ${passage.psalm}`}</Text>
          <PsalmText passage={passage} size="body" />
        </View>
      ))}
    </View>
  );
}

// a reading citation resolved to scripture with the reader's current settings.
function ReadingRow({ ref }: { ref: string }) {
  const styles = useThemedStyles(sanctoraleCardStyles);
  const feast = useThemedStyles(feastStyles);
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

  if (passages.length === 0) {
    return <Text style={[styles.lessonMissing, feast.citation]}>{ref}</Text>;
  }
  return (
    <View style={[styles.lessonRow, feast.citation]}>
      {passages.map((passage) => {
        const first = passage.verses[0]?.number;
        const last = passage.verses[passage.verses.length - 1]?.number;
        return (
          <ScriptureView
            key={`${passage.book}-${passage.chapter}-${first ?? "x"}-${last ?? "x"}`}
            passage={passage}
            size="body"
          />
        );
      })}
    </View>
  );
}

/** one card for a holy day or a lesser feast, composed from the church's own
 * observation. sections only render when that book actually supplies them. */
export function FeastCard({
  feast,
  tradition,
  showTitle = true,
  showBio = true,
  showLiturgy = true,
}: {
  feast: FeastIdentity;
  tradition: CalendarTradition;
  showTitle?: boolean;
  showBio?: boolean;
  showLiturgy?: boolean;
}) {
  const styles = useThemedStyles(sanctoraleCardStyles);
  const heading = useSectionHeading();
  const subheading = useSubheading();
  const observation = observationForTradition(feast, tradition);
  const name = observation.name;
  const date = feastMonthDayLabel(observation.month, observation.day);
  const calendarLine = `${CHURCH_CALENDARS[tradition]} Calendar`;
  const bio =
    SANCTORALE_BIOS[feast.slug] ??
    LESSER_FEAST_BIOS[feast.slug] ??
    OLDER_FEAST_BIOS[feast.slug];
  const propers = showLiturgy ? propersForFeast(feast, tradition) : null;
  const link =
    tradition === "tec" && feast.rank !== "lesser"
      ? TEC_HOLY_DAY_LINK
      : BOOK_LINK[tradition];
  // lesser feasts keep the subheading voice; only holy days take the heading
  const titleStyle =
    feast.rank === "lesser"
      ? [subheading, styles.lesserFeastTitle]
      : styles.detailTitle;

  return (
    <View>
      {showTitle ? <Text style={titleStyle}>{name}</Text> : null}
      <Text style={styles.detailSubtitle}>
        {showTitle ? `${calendarLine}\n` : null}
        {date}
        {feast.trial ? " · Trial use" : ""}
      </Text>

      {showBio ? (
        <View style={styles.group}>
          {bio ? (
            <Text style={styles.bioText}>{bio}</Text>
          ) : (
            <Text style={styles.bioText}>{`Commemorated on ${date}.`}</Text>
          )}
          <WikiLinks name={name} slug={feast.slug} />
          {link ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => openExternal(link.url)}
              accessibilityRole="link"
              accessibilityLabel={link.label}
            >
              {({ hovered }) => (
                <Text style={[styles.link, hovered && styles.linkHover]}>
                  {link.label}
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {propers && propers.psalms.length > 0 ? (
        <View style={styles.group}>
          <StickyHeading sticky>
            <Text style={heading}>
              {propers.psalmSource === "course"
                ? "Psalms (ordinary course)"
                : "Psalms"}
            </Text>
          </StickyHeading>
          {propers.psalms.map((ref, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: an appointment can repeat a citation
            <PsalmRow key={`${ref}-${i}`} ref={ref} tradition={tradition} />
          ))}
        </View>
      ) : null}

      {propers && propers.readings.length > 0 ? (
        <View style={styles.group}>
          <StickyHeading sticky>
            <Text style={heading}>Readings</Text>
          </StickyHeading>
          {propers.readings.map((ref, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: an appointment can repeat a citation
            <ReadingRow key={`${ref}-${i}`} ref={ref} />
          ))}
        </View>
      ) : null}

      {propers?.collect ? (
        <View style={styles.group}>
          <Text style={[subheading, styles.tightSubheading]}>Collect</Text>
          <Text style={styles.collectRite}>{propers.collect.title}</Text>
          {appointmentInCollectTitle(name, propers.collect.title) ? null : (
            <Text style={styles.lessonRef}>{`Appointed for ${name}`}</Text>
          )}
          <Text style={styles.collectText}>{propers.collect.text}</Text>
        </View>
      ) : null}
    </View>
  );
}
