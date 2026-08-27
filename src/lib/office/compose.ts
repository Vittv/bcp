import {
  addDays,
  easterYear,
  feastsForEasterYear,
  resolve,
  seasonFor,
  sundayOnOrBefore,
  toDays,
  weekday,
} from "../calendar";
import type { CalendarDate, DolSlot, Season } from "../calendar/types";
import { collectPassage, office } from "../content";
import { entryForDay, entryForEvening } from "../content/lectionary";
import { parsePsalmCitation } from "../content/psalms";
import { psalmPassage } from "../content/psalter";
import type {
  CollectSection,
  DolEntry,
  DolLessonGroup,
  Office,
  OfficeItem,
  OfficeSection,
  PsalmPassage,
} from "../content/types";
import type {
  ComposedLesson,
  ComposedNode,
  ComposedSection,
  OfficeDocument,
  OfficePrefs,
} from "./types";
import { DEFAULT_PREFS } from "./types";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ORDINALS = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
];

const EVENING_OFFICES = new Set(["evening-rite-one", "evening-rite-two"]);
const MORNING_OFFICES = new Set(["morning-rite-one", "morning-rite-two"]);

// Collects of the church year used directly on their proper day.
const SPECIAL_COLLECTS: Record<string, string> = {
  "dec-24": "Fourth Sunday of Advent",
  "christmas-day": "The Nativity of Our Lord:  Christmas Day",
  "first-sunday-after-christmas": "First Sunday after Christmas Day",
  "second-sunday-after-christmas": "Second Sunday after Christmas Day",
  "holy-name": "The Holy Name",
  epiphany: "The Epiphany",
  "ash-wednesday": "Ash Wednesday",
  "palm-sunday": "Sunday of the Passion:  Palm Sunday",
  "maundy-thursday": "Maundy Thursday",
  "good-friday": "Good Friday",
  "holy-saturday": "Holy Saturday",
  "easter-day": "Easter Day",
  ascension: "Ascension Day",
  "eve-of-pentecost": "The Day of Pentecost:  Whitsunday",
  pentecost: "The Day of Pentecost:  Whitsunday",
  "eve-of-trinity": "The Day of Pentecost:  Whitsunday",
  trinity: "First Sunday after Pentecost:  Trinity Sunday",
};

// fixed-date holy days map onto the holy-days collects.
const HOLY_DAY_COLLECTS: Record<string, string> = {
  "st-andrew": "Saint Andrew",
  "st-thomas": "Saint Thomas",
  "st-stephen": "Saint Stephen",
  "st-john": "Saint John",
  "holy-innocents": "The Holy Innocents",
  "confession-of-st-peter": "Confession of Saint Peter",
  "conversion-of-st-paul": "Conversion of Saint Paul",
  presentation: "The Presentation",
  "st-matthias": "Saint Matthias",
  "st-joseph": "Saint Joseph",
  annunciation: "The Annunciation",
  "st-mark": "Saint Mark",
  "philip-and-james": "Saint Philip and Saint James",
  visitation: "The Visitation",
  "st-barnabas": "Saint Barnabas",
  "nativity-of-st-john-the-baptist": "The Nativity of Saint John the Baptist",
  "peter-and-paul": "Saint Peter and Saint Paul",
  "st-mary-magdalene": "Saint Mary Magdalene",
  "st-james": "Saint James",
  transfiguration: "The Transfiguration",
  "st-mary-the-virgin": "Saint Mary the Virgin",
  "st-bartholomew": "Saint Bartholomew",
  "holy-cross": "Holy Cross Day",
  "st-matthew": "Saint Matthew",
  "st-michael-and-all-angels": "Saint Michael and All Angels",
  "st-luke": "Saint Luke",
  "st-james-of-jerusalem": "Saint James of Jerusalem",
  "simon-and-jude": "Saint Simon and Saint Jude",
  "all-saints": "All Saint's Day",
};

// BCP pp. 15-18: all Sundays are feasts of our Lord, and only these fixed
// feasts take precedence of a Sunday (All Saints as a Principal Feast may
// always be observed on its day).
const SUNDAY_FEASTS = new Set([
  "holy-name",
  "presentation",
  "transfiguration",
  "all-saints",
]);

type ComposeContext = {
  date: CalendarDate;
  litDate: CalendarDate;
  litSlot: DolSlot;
  slot: DolSlot;
  entry: DolEntry | undefined;
  season: Season;
  holyDay: string | undefined;
  isTrinity: boolean;
  ascensionOrAfter: boolean;
  psalmCitations: string[] | undefined;
  lessonGroup: DolEntry["lessons"] | undefined;
  prefs: OfficePrefs;
};

function isMorningOffice(id: string): boolean {
  return MORNING_OFFICES.has(id);
}

function isEveningOffice(id: string): boolean {
  return EVENING_OFFICES.has(id);
}

function entryLessonGroup(
  entry: DolEntry,
  morning: boolean,
): DolLessonGroup | undefined {
  const group = morning ? entry.lessons.morning : entry.lessons.evening;
  if (group) return group;
  // year-table entries carry a single lesson set shared by morning and evening.
  const { first, second, third, gospel, altFirst, altSecond, altGospel } =
    entry.lessons;
  if (first || second || third || gospel) {
    return { first, second, third, gospel, altFirst, altSecond, altGospel };
  }
  return undefined;
}

// compose the daily variable content (psalms, lessons, collect of the day)
// into the fixed office text. the office itself is chosen by the caller.
export function composeOffice(
  date: CalendarDate,
  officeId: Office["id"],
  prefs: OfficePrefs = DEFAULT_PREFS,
): OfficeDocument {
  const found = office(officeId);
  if (!found) throw new Error(`unknown office ${officeId}`);
  const evening = isEveningOffice(officeId);

  // the liturgical day begins at evening, so Evening Prayer composes the
  // next day's readings and psalms (save for the appointed evening specials,
  // e.g. Christmas Eve, whose readings belong to the current date).
  const litDate = evening ? addDays(date, 1) : date;
  const litSlot = resolve(litDate);
  const eveningSpecial = evening ? entryForEvening(resolve(date)) : undefined;
  const slot = eveningSpecial ? resolve(date) : litSlot;
  const entry =
    eveningSpecial ??
    (isMorningOffice(officeId) || evening ? entryForDay(slot) : undefined);

  const ctx: ComposeContext = {
    date,
    litDate,
    litSlot,
    slot,
    entry,
    season: seasonFor(litDate),
    holyDay: litSlot.holyDay,
    isTrinity: litSlot.day.kind === "special" && litSlot.day.name === "trinity",
    ascensionOrAfter: (() => {
      const f = feastsForEasterYear(easterYear(litDate));
      const d = toDays(litDate);
      return d >= f.ascension && d < f.pentecost;
    })(),
    psalmCitations:
      entry && (isMorningOffice(officeId) || evening)
        ? isMorningOffice(officeId)
          ? entry.psalms.morning
          : entry.psalms.evening
        : undefined,
    lessonGroup:
      entry && (isMorningOffice(officeId) || evening)
        ? entryLessonGroup(entry, isMorningOffice(officeId))
        : undefined,
    prefs,
  };

  const sections: ComposedSection[] = [];
  for (const section of found.sections) {
    const composed = composeSection(section, ctx);
    if (composed.nodes.length > 0) sections.push(composed);
  }

  return {
    office: officeId,
    officeName: found.name,
    rite: found.rite ?? null,
    date,
    slot,
    entryTitle: entry?.title ?? null,
    sections,
  };
}

function composeSection(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedSection {
  const base = { key: section.key, heading: section.heading ?? null };
  switch (section.key) {
    case "opening":
      return { ...base, nodes: composeOpening(section, ctx) };
    case "invitatory":
      return { ...base, nodes: composeInvitatory(section, ctx) };
    case "psalms":
      return { ...base, nodes: composePsalms(section, ctx) };
    case "lessons":
      return { ...base, nodes: composeLessons(section, ctx) };
    case "suffrages-b":
      return { ...base, nodes: composeSuffragesB(section, ctx) };
    default:
      return { ...base, nodes: composeOpening(section, ctx) };
  }
}

// the day-appropriate occasional collect, e.g. "A Collect for Fridays".
function dayCollectTitle(weekdayOfDate: number): string | undefined {
  switch (weekdayOfDate) {
    case 0:
      return "A Collect for Sundays";
    case 5:
      return "A Collect for Fridays";
    case 6:
      return "A Collect for Saturdays";
    default:
      return undefined;
  }
}

const OCCASIONAL_COLLECTS = new Set(["A Collect for Peace"]);

function keepOccasionalCollect(title: string, weekdayOfDate: number): boolean {
  return (
    OCCASIONAL_COLLECTS.has(title) || title === dayCollectTitle(weekdayOfDate)
  );
}

// personal mode suppresses rubrics by default — they are liturgical
// instructions for a service, not spoken text in solo prayer.
function showRubrics(prefs: OfficePrefs): boolean {
  return prefs.showRubrics && !prefs.personalMode;
}

// generalized section composer (opening sentences, confession, creed,
// suffrages-a, and the single opening section of Noonday and Compline, which
// carries the whole service):
//   - season items keep only the current season's opening-sentence group
//   - option menus ("or this"/"or the following") collapse to the first
//     alternative
//   - collect menus trim to the first collect plus the day-appropriate one
function composeOpening(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const nodes: ComposedNode[] = [];
  let keep = true; // season-group state for opening sentences
  let inOption = false;
  let inCollectMenu = false;
  let inPrayerMenu = false;
  let collectKept = false;
  let collectTitle: string | undefined;
  let collectBuf: string[] = [];
  let skipAbsolution = false;
  const items = section.items;
  let idx = 0;
  while (idx < items.length) {
    const item = items[idx];
    if (skipAbsolution) {
      idx++;
      continue;
    }
    if (item.kind === "season") {
      keep = keepSeasonGroup(item.text, ctx);
      if (keep) nodes.push({ kind: "heading", text: item.text });
      idx++;
      continue;
    }
    if (item.kind === "option") {
      inOption = true;
      idx++;
      continue;
    }
    if (item.kind === "heading") {
      if (collectBuf.length > 0) {
        nodes.push({
          kind: "fixed-collect",
          text: collectBuf.join("\n"),
          title: collectTitle,
        });
        collectBuf = [];
        collectTitle = undefined;
      }
      inOption = false;
      inCollectMenu = false;
      inPrayerMenu = false;

      // daily-devotions single reading: the "A Reading" heading carries the
      // lesson citation, followed by the BCP-printed passage text which we
      // replace with the same inline KJV rendering used for office lessons.
      if (item.text === "A Reading" && item.citation) {
        nodes.push({
          kind: "lessons",
          lessons: [{ number: 1, label: "A Reading", ref: item.citation }],
        });
        idx++;
        while (idx < items.length && items[idx].kind === "text") idx++;
        continue;
      }

      // daily-devotions fixed collect: the "The Collect" heading is followed
      // by the collect text, optionally an "or this" alternative to drop.
      if (item.text === "The Collect") {
        const buf: string[] = [];
        idx++;
        while (idx < items.length && items[idx].kind === "text") {
          buf.push(items[idx].text);
          idx++;
        }
        if (idx < items.length && items[idx].kind === "option") {
          idx++;
          while (idx < items.length && items[idx].kind === "text") idx++;
        }
        if (buf.length > 0)
          nodes.push({ kind: "fixed-collect", text: buf.join("\n") });
        continue;
      }

      const psalmMatch = item.text.match(/^(?:From )?Psalm (\d+)\s*(.*)/);
      if (psalmMatch && keep) {
        const psalmNum = Number(psalmMatch[1]);
        const incipit = psalmMatch[2]?.trim() || undefined;
        const verses: PsalmPassage["verses"] = [];
        let j = idx + 1;
        while (j < items.length && items[j].kind === "text") {
          verses.push({ number: verses.length + 1, text: items[j].text });
          j++;
        }
        if (verses.length > 0) {
          nodes.push({
            kind: "psalm",
            passage: { psalm: psalmNum, verses },
            citation: String(psalmNum),
            incipit,
          });
          idx = j;
          continue;
        }
      }
      if (keep) {
        const node = convert(item, ctx.prefs);
        if (node) nodes.push(node);
      }
      idx++;
      continue;
    }
    if (item.kind === "rubric") {
      inOption = false;
      const text = item.text;
      if (
        ctx.prefs.personalMode &&
        section.key === "confession" &&
        /Priest.*stands and says/i.test(text)
      ) {
        skipAbsolution = true;
        idx++;
        continue;
      }
      if (
        /(one or more of the following Collect|one of the following Collects?)/i.test(
          text,
        )
      ) {
        inCollectMenu = true;
        collectKept = false;
        collectTitle = undefined;
        collectBuf = [];
      } else if (/(one of the following prayers?)/i.test(text)) {
        inCollectMenu = false;
        inPrayerMenu = true;
      } else if (inCollectMenu && text.startsWith("A Collect for ")) {
        // flush any pending collect before starting a new titled one
        if (collectBuf.length > 0) {
          nodes.push({
            kind: "fixed-collect",
            text: collectBuf.join("\n"),
            title: collectTitle,
          });
          collectBuf = [];
        }
        collectTitle = text;
        collectKept = !keepOccasionalCollect(text, weekday(ctx.date));
        if (collectKept) {
          idx++;
          continue;
        }
      } else {
        if (collectBuf.length > 0) {
          nodes.push({
            kind: "fixed-collect",
            text: collectBuf.join("\n"),
            title: collectTitle,
          });
          collectBuf = [];
          collectTitle = undefined;
        }
        inCollectMenu = false;
      }
      if (keep) {
        const node = convert(item, ctx.prefs);
        if (node) nodes.push(node);
      }
      idx++;
      continue;
    }
    if (inCollectMenu) {
      if (collectKept) {
        idx++;
        continue;
      }
      if (item.kind === "text") {
        collectBuf.push(item.text);
        if (item.speaker === "people") {
          nodes.push({
            kind: "fixed-collect",
            text: collectBuf.join("\n"),
            title: collectTitle,
          });
          collectBuf = [];
          collectTitle = undefined;
        }
      }
      idx++;
      continue;
    }
    if ((inOption && !inPrayerMenu) || !keep) {
      idx++;
      continue;
    }
    const node = convert(item, ctx.prefs);
    if (node) nodes.push(node);
    idx++;
  }
  return nodes;
}

// the seasonal Invitatory Antiphon groups, selected by the current season.
const ANTIPHON_GROUPS: Record<string, (ctx: ComposeContext) => boolean> = {
  "In Advent": (c) => c.season === "advent",
  "On the Twelve Days of Christmas": (c) => c.season === "christmas",
  "From the Epiphany through the Baptism of Christ, and on the Feasts of the Transfiguration and Holy Cross":
    (c) => c.season === "epiphany",
  "In Lent": (c) => c.season === "lent" || c.season === "holy-week",
  "From Easter Day until the Ascension": (c) =>
    c.season === "easter" && !c.ascensionOrAfter,
  "From Ascension Day until the Day of Pentecost": (c) =>
    c.season === "easter" && c.ascensionOrAfter,
  "On the Day of Pentecost": (c) => c.season === "pentecost",
  "On Trinity Sunday": (c) => c.isTrinity,
  "On other Sundays and weekdays": (c) =>
    c.season === "after-pentecost" && c.holyDay === undefined,
  "The Alleluias in the following Antiphons are used only in Easter Season.": (
    c,
  ) => c.season === "easter" || c.season === "pentecost",
  "On Feasts of the Incarnation": (c) =>
    c.litSlot.day.kind === "special" &&
    new Set([
      "christmas-day",
      "epiphany",
      "baptism",
      "annunciation",
      "presentation",
      "transfiguration",
      "ascension",
    ]).has(c.litSlot.day.name),
  "On all Saints and other Major Saints' Days": (c) => c.holyDay !== undefined,
};

function isAntiphonMarker(text: string): boolean {
  return text in ANTIPHON_GROUPS;
}

function composeInvitatory(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const pascha = ctx.slot.week.kind === "easter-week";
  const nodes: ComposedNode[] = [];
  let keep = true;
  for (const item of section.items) {
    if (item.kind === "option") {
      // alternative antiphons after "or this": keep only the first.
      keep = false;
      continue;
    }
    if (item.kind === "season") {
      if (keepSeasonGroup(item.text, ctx)) {
        nodes.push({ kind: "heading", text: item.text });
      }
      continue;
    }
    if (item.kind === "rubric") {
      if (item.text.startsWith("or Psalm 95")) continue;
      if (item.text.startsWith("In Easter Week")) continue;
      if (item.text.startsWith("Except in Lent, add")) {
        keep = ctx.season !== "lent" && ctx.season !== "holy-week";
        if (showRubrics(ctx.prefs))
          nodes.push({ kind: "rubric", text: item.text });
        continue;
      }
      if (isAntiphonMarker(item.text)) {
        keep = ANTIPHON_GROUPS[item.text](ctx);
        if (keep && showRubrics(ctx.prefs))
          nodes.push({ kind: "rubric", text: item.text });
        continue;
      }
      keep = true;
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
      continue;
    }
    if (item.kind === "heading") {
      keep = true;
      if (item.text.startsWith("Christ our Passover") !== pascha) continue;
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
      continue;
    }
    if (keep) {
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
    }
  }
  return nodes;
}

// the appointed psalms, text inline, followed by the office's conclusion.
function composePsalms(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const nodes: ComposedNode[] = [];
  for (const citation of ctx.psalmCitations ?? []) {
    const parsed = parsePsalmCitation(citation);
    if (!parsed) continue;
    const passage = psalmPassage(parsed);
    if (!passage) continue;
    nodes.push({
      kind: "psalm",
      passage,
      citation,
      optional: parsed.optional,
    });
  }
  for (const item of section.items) {
    const node = convert(item, ctx.prefs);
    if (node) nodes.push(node);
  }
  return nodes;
}

// lesson references render as labeled placeholders until Bible text ships.
// the reading framework is kept, and only as many canticles as there are
// lessons, so the office does not dump the whole canticle menu.
function composeLessons(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const lessons = lessonList(ctx);
  const maxCanticles = lessons.length;
  const nodes: ComposedNode[] = [];
  let region: "reading" | "canticles" = "reading";
  let canticlesKept = 0;
  let inKeptCanticle = false;
  for (const item of section.items) {
    if (item.kind === "text" && item.text.includes("A Reading (Lesson) from")) {
      if (lessons.length > 0) {
        nodes.push({ kind: "lessons", lessons });
        continue;
      }
    }
    if (item.kind === "heading") {
      region = "canticles";
      if (canticlesKept < maxCanticles) {
        canticlesKept += 1;
        inKeptCanticle = true;
        const node = convert(item, ctx.prefs);
        if (node) nodes.push(node);
      } else {
        inKeptCanticle = false;
      }
      continue;
    }
    if (region === "reading") {
      if (item.kind === "season") continue;
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
      continue;
    }
    if (inKeptCanticle) {
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
    }
  }
  return nodes;
}

function composeSuffragesB(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const collect = collectNode(ctx);
  const nodes: ComposedNode[] = [];
  // Within each option menu only the first alternative (text + its response)
  // is kept; occasional collects are trimmed to the day-appropriate ones.
  let menu: "prayers" | "mission" | "thanksgiving" | "closing" = "prayers";
  let keepGroup = true;
  let firstKept = false;
  let collectTitle: string | undefined;
  let collectBuf: string[] = [];
  for (const item of section.items) {
    if (item.kind === "rubric") {
      if (menu === "thanksgiving") firstKept = false;
      const text = item.text;
      if (text === "The Collect of the Day") {
        flushCollectBuf(nodes, collectBuf, collectTitle);
        collectBuf = [];
        collectTitle = undefined;
        if (showRubrics(ctx.prefs))
          nodes.push({ kind: "rubric", text: item.text });
        if (collect) nodes.push(collect);
        continue;
      }
      if (text.startsWith("Then, unless the Eucharist")) {
        flushCollectBuf(nodes, collectBuf, collectTitle);
        collectBuf = [];
        collectTitle = undefined;
        menu = "mission";
        firstKept = false;
        const node = convert(item, ctx.prefs);
        if (node) nodes.push(node);
        continue;
      }
      if (text.startsWith("Before the close of the Office")) {
        flushCollectBuf(nodes, collectBuf, collectTitle);
        collectBuf = [];
        collectTitle = undefined;
        menu = "thanksgiving";
        firstKept = false;
        const node = convert(item, ctx.prefs);
        if (node) nodes.push(node);
        continue;
      }
      if (text.startsWith("The Officiant may then conclude")) {
        flushCollectBuf(nodes, collectBuf, collectTitle);
        collectBuf = [];
        collectTitle = undefined;
        menu = "closing";
        firstKept = false;
        const node = convert(item, ctx.prefs);
        if (node) nodes.push(node);
        continue;
      }
      if (menu === "thanksgiving") {
        if (text.startsWith("Then may be said")) {
          menu = "prayers"; // dismissal: end of the thanksgiving menu
          firstKept = false;
        }
        // else: the group's own heading falls through
      }
      if (text.startsWith("A Collect for ")) {
        flushCollectBuf(nodes, collectBuf, collectTitle);
        collectBuf = [];
        collectTitle = undefined;
        keepGroup = keepOccasionalCollect(text, weekday(ctx.date));
        if (keepGroup) {
          collectTitle = text;
        }
        continue;
      }
      if (text === "Concerning the Service") {
        flushCollectBuf(nodes, collectBuf, collectTitle);
        collectBuf = [];
        collectTitle = undefined;
        break; // reference notes, not liturgy
      }
      flushCollectBuf(nodes, collectBuf, collectTitle);
      collectBuf = [];
      collectTitle = undefined;
      if (menu !== "thanksgiving") {
        menu = "prayers";
        keepGroup = true;
      }
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
      continue;
    }
    if (item.kind === "option") {
      firstKept = false;
      continue;
    }
    if (menu === "mission" || menu === "thanksgiving") {
      if (firstKept) continue;
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
      if (item.kind === "text" && item.speaker === "people") firstKept = true;
      continue;
    }
    if (menu === "closing") {
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
      continue;
    }
    if (collectTitle) {
      const node = convert(item, ctx.prefs);
      if (node && node.kind === "text") collectBuf.push(node.text);
      continue;
    }
    if (keepGroup) {
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
    }
  }
  flushCollectBuf(nodes, collectBuf, collectTitle);
  return nodes;
}

function flushCollectBuf(
  nodes: ComposedNode[],
  buf: string[],
  title: string | undefined,
): void {
  if (buf.length === 0) return;
  nodes.push({ kind: "fixed-collect", text: buf.join("\n"), title });
}

function lessonList(ctx: ComposeContext): ComposedLesson[] {
  const group = ctx.lessonGroup;
  if (!group) return [];
  const lessons: ComposedLesson[] = [];
  const fields: Array<{
    key: "first" | "second" | "third" | "gospel";
    label: string;
    number: 1 | 2 | 3;
    alt: "altFirst" | "altSecond" | "altGospel" | null;
  }> = [
    { key: "first", alt: "altFirst", label: "First Lesson", number: 1 },
    { key: "second", alt: "altSecond", label: "Second Lesson", number: 2 },
    { key: "third", alt: null, label: "Third Lesson", number: 3 },
    { key: "gospel", alt: "altGospel", label: "Gospel", number: 3 },
  ];
  for (const { key, alt, label, number } of fields) {
    const ref = group[key];
    if (typeof ref !== "string") continue;
    lessons.push({ number, label, ref });
    if (alt === null || !ctx.prefs.showAlternates) continue;
    const alternate = group[alt];
    if (typeof alternate === "string") {
      lessons.push({
        number,
        label: `${label} (alternative)`,
        ref: alternate,
        optional: true,
      });
    }
  }
  return lessons;
}

function collectNode(ctx: ComposeContext): ComposedNode | undefined {
  const found = collectForDate(ctx.litDate, ctx.litSlot);
  if (!found) return undefined;
  const passage = collectPassage(
    ctx.prefs.collectRite,
    found.section,
    found.title,
  );
  if (!passage) return undefined;
  return { kind: "collect", passage };
}

function collectForDate(
  date: CalendarDate,
  slot: DolSlot,
): { title: string; section: CollectSection } | undefined {
  if (slot.day.kind === "special") {
    const direct = SPECIAL_COLLECTS[slot.day.name];
    if (direct) return { title: direct, section: "church-year" };
    // the weekdays of the Epiphany season use the Epiphany collect.
    if (
      slot.week.kind === "epiphany-following" &&
      /^jan-\d+$/.test(slot.day.name)
    ) {
      return { title: "The Epiphany", section: "church-year" };
    }
  }
  if (slot.holyDay) {
    // BCP pp. 16-18: a fixed feast yields to the Sunday proper (save the
    // feasts that outrank a Sunday), and no fixed feast is observed in
    // Holy Week or Easter Week.
    const sunday = slot.day.kind === "weekday" && slot.day.weekday === 0;
    const inHolyWeek =
      slot.week.kind === "holy-week" || slot.week.kind === "easter-week";
    if ((!sunday || SUNDAY_FEASTS.has(slot.holyDay)) && !inHolyWeek) {
      const title = HOLY_DAY_COLLECTS[slot.holyDay];
      if (title) return { title, section: "holy-days" };
    }
  }
  if (slot.week.kind === "holy-week" && slot.day.kind === "weekday") {
    return {
      title: `${WEEKDAY_NAMES[slot.day.weekday]} in Holy Week`,
      section: "church-year",
    };
  }
  if (slot.week.kind === "easter-week" && slot.day.kind === "weekday") {
    return {
      title: `${WEEKDAY_NAMES[slot.day.weekday]} in Easter Week`,
      section: "church-year",
    };
  }
  // ordinary weekdays use the collect of their week (the DOL proper week runs
  // Monday to Sunday, so the week's slot already names it).
  const weekCollect = sundayCollectForSlot(slot);
  if (weekCollect) return { title: weekCollect, section: "church-year" };
  // weeks without a Sunday collect of their own (the Christmas season) borrow
  // from the preceding Sunday.
  const sunday = resolve(sundayOnOrBefore(date));
  if (sunday.day.kind === "special") {
    const direct = SPECIAL_COLLECTS[sunday.day.name];
    if (direct) return { title: direct, section: "church-year" };
  }
  const title = sundayCollectForSlot(sunday);
  if (title) return { title, section: "church-year" };
  return undefined;
}

// the collect for a Sunday: every Sunday has one, so a weekday borrows it.
function sundayCollectForSlot(slot: DolSlot): string | undefined {
  switch (slot.week.kind) {
    case "advent":
      return `${ORDINALS[slot.week.week - 1]} Sunday of Advent`;
    case "epiphany":
      return slot.week.week === 1
        ? "First Sunday after the Epiphany:  The Baptism of our Lord"
        : `${ORDINALS[slot.week.week]} Sunday after the Epiphany`;
    case "last-epiphany":
      return "Last Sunday after the Epiphany";
    case "lent":
      return `${ORDINALS[slot.week.week - 1]} Sunday in Lent`;
    case "easter":
      return slot.week.week === 7
        ? "Seventh Sunday of Easter:  The Sunday after Ascension Day"
        : `${ORDINALS[slot.week.week - 1]} Sunday of Easter`;
    case "pentecost":
      return "The Day of Pentecost:  Whitsunday";
    case "after-pentecost":
      return `Proper ${slot.week.proper}`;
    default:
      return undefined;
  }
}

// the season marker groups that begin the opening sentences and antiphons.
function keepSeasonGroup(text: string, ctx: ComposeContext): boolean {
  switch (text) {
    case "Advent":
      return ctx.season === "advent";
    case "Christmas":
      return ctx.season === "christmas";
    case "Epiphany":
      return ctx.season === "epiphany";
    case "Lent":
      return ctx.season === "lent";
    case "Holy Week":
      return ctx.season === "holy-week";
    case "Easter Season, including Ascension Day and the Day of Pentecost":
      return ctx.season === "easter" || ctx.season === "pentecost";
    case "Trinity Sunday":
      return ctx.isTrinity;
    case "All Saints and other Major Saints' Days":
      return ctx.holyDay !== undefined;
    case "Occasions of Thanksgiving":
      return false;
    case "At any Time":
      return true;
    default:
      return false;
  }
}

function convert(
  item: OfficeItem,
  prefs: OfficePrefs,
): ComposedNode | undefined {
  switch (item.kind) {
    case "heading":
      return { kind: "heading", text: item.text, citation: item.citation };
    case "rubric":
      return showRubrics(prefs)
        ? { kind: "rubric", text: item.text }
        : undefined;
    case "text":
      return {
        kind: "text",
        text: item.text,
        speaker: prefs.personalMode ? undefined : item.speaker,
      };
    case "option":
      return undefined;
    case "season":
      return { kind: "heading", text: item.text };
  }
}

export function dayLabel(date: CalendarDate): string {
  return `${WEEKDAY_NAMES[weekday(date)]}, ${MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year}`;
}
