import {
  addDays,
  easterYear,
  feastsForEasterYear,
  resolve,
  sanctoraleBySlug,
  seasonFor,
  sundayOnOrBefore,
  toDays,
  weekday,
} from "../calendar";
import type { CalendarDate, DolSlot, Season } from "../calendar/types";
import { canticlePassage, collectPassage, office } from "../content";
import {
  entryForAlternateYear,
  entryForDay,
  entryForEvening,
} from "../content/lectionary";
import { parsePsalmCitation } from "../content/psalms";
import { psalmPassage } from "../content/psalter";
import { psalterDay, psalterDayForDate } from "../content/psalterDays";
import type {
  CollectSection,
  DolEntry,
  DolLessonGroup,
  Office,
  OfficeItem,
  OfficeSection,
  PsalmPassage,
} from "../content/types";
import type { OfficeCustomization } from "./customization";
import { suggestedCanticles } from "./suggestedCanticles";
import type {
  ComposedLesson,
  ComposedNode,
  ComposedSection,
  LessonSlot,
  MenuChoiceOption,
  OfficeChoices,
  OfficeDocument,
  OfficeMenus,
  OfficePrefs,
  OfficeRite,
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

// the collect title for a sanctorale slug; an eve entry takes its feast's
// collect (a prior-evening celebration uses the collect of the feast day).
export function holyDayCollectTitle(slug: string): string | undefined {
  const feast = sanctoraleBySlug(slug)?.eveOf ?? slug;
  return HOLY_DAY_COLLECTS[feast];
}

type ComposeContext = {
  officeId: Office["id"];
  rite: "One" | "Two";
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
  // the printed inline menus of noonday and compline, parsed once
  menuRegions?: MenuRegions;
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

// the psalms for an office: the lectionary's appointed set, or the 30-day
// psalter's portion for the calendar day. feasts keep their appointed psalms
// by default; the reader can still swap the cycle explicitly.
function officePsalmCitations(
  officeId: Office["id"],
  date: CalendarDate,
  entry: DolEntry | undefined,
  customization: OfficeCustomization | undefined,
): string[] | undefined {
  const morning = isMorningOffice(officeId);
  const evening = isEveningOffice(officeId);
  if (!(morning || evening)) return undefined;
  if (customization?.psalmCycle === "psalter30") {
    const portion = psalterDay(psalterDayForDate(date));
    const citations = morning ? portion?.morning : portion?.evening;
    if (citations && citations.length > 0) return citations;
  }
  if (!entry) return undefined;
  return morning ? entry.psalms.morning : entry.psalms.evening;
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

  // the 1979 Daily Office Lectionary assigns each date its own office, so
  // every part of the day carries that date's entry. the only exceptions are
  // the appointed "Eve of ..." evenings (e.g. Christmas Eve, Eve of Holy
  // Cross), which keep their own printed evening readings and borrow the
  // following day's collect.
  const slot = resolve(date);
  const eveningSpecial = evening ? entryForEvening(slot) : undefined;
  const litDate = evening && slot.evening ? addDays(date, 1) : date;
  const litSlot = resolve(litDate);
  const entry =
    eveningSpecial ?? (found.rite === null ? undefined : entryForDay(slot));

  const ctx: ComposeContext = {
    officeId,
    rite: found.rite ?? prefs.rite,
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
    psalmCitations: officePsalmCitations(
      officeId,
      date,
      entry,
      prefs.customization,
    ),
    lessonGroup:
      entry && (isMorningOffice(officeId) || evening)
        ? entryLessonGroup(entry, isMorningOffice(officeId))
        : undefined,
    prefs,
  };

  // noonday and compline carry their alternative menus inside their single
  // section; parse the ranges once and share them with choices and composer
  if (MENU_OFFICES.has(officeId) && found.sections.length === 1) {
    ctx.menuRegions = menuRegions(found.sections[0]);
  }

  const choices = officeChoices(found, ctx);
  const sections: ComposedSection[] = [];
  for (const section of found.sections) {
    // suffrages A and B are alternatives sharing one tail. A is kept only
    // when picked; B always runs because its second half is the collects,
    // prayers and closing that follow either set of versicles.
    if (section.key === "suffrages-a" && suffragesChoice(ctx) !== "a") continue;
    const composed = composeSection(section, ctx);
    if (composed.nodes.length === 0) continue;
    if (section.key === "suffrages-a") {
      composed.heading = "Suffrages A";
    }
    if (section.key === "suffrages-b") {
      composed.heading = suffragesChoice(ctx) === "b" ? "Suffrages B" : null;
    }
    sections.push(composed);
  }
  return {
    office: officeId,
    officeName: found.name,
    rite: found.rite ?? null,
    date,
    slot,
    entryTitle: entry?.title ?? null,
    choices,
    sections,
  };
}

function suffragesChoice(ctx: ComposeContext): "a" | "b" {
  const explicit = ctx.prefs.customization?.suffrages;
  if (explicit === "a" || explicit === "b") return explicit;
  // the printed books suggest B in the morning and A in the evening
  return isEveningOffice(ctx.officeId) ? "a" : "b";
}

// whether a stored readings choice rules today: digits only where the day
// shares at least one position with the stored set. the picker shows the
// whole day on the days the choice degrades
export function readingsApply(choices: OfficeChoices, stored: string): boolean {
  if (!choices.lessonSlots) return false;
  const present = new Set<number>(
    choices.lessonSlots.map((slot) => READING_NUMBERS[slot.key]),
  );
  return [...stored].some((digit) => present.has(Number(digit)));
}

// the suggestions and option lists the inline controls need. computed from
// the same context the sections use, but never from the reader's overrides.
function officeChoices(found: Office, ctx: ComposeContext): OfficeChoices {
  const openingSection = found.sections.find(isOpeningSentenceSection);
  const groups = openingSection ? sentenceGroups(openingSection).groups : [];
  const readings = new Set(lessonList(ctx).map((lesson) => lesson.number)).size;
  const lessonOffice =
    (isMorningOffice(ctx.officeId) || isEveningOffice(ctx.officeId)) &&
    ctx.lessonGroup !== undefined;
  return {
    openingSuggested: suggestedOpeningText(groups, ctx),
    openingGroups: groups,
    invitatorySuggested: defaultInvitatory(ctx),
    canticleSuggested: [
      suggestedCanticleForSlot(ctx, 1, readings),
      suggestedCanticleForSlot(ctx, 2, readings),
    ],
    suffragesSuggested: isEveningOffice(ctx.officeId) ? "a" : "b",
    lessonSlots: lessonOffice ? lessonSlotsOf(ctx) : undefined,
    menus: officeMenus(ctx),
  };
}

// the day's reading slots for the Readings picker, in print order. the
// corpus descriptors are spelled out on shared year-table days, where the
// book's own arrangement says them; split-set days keep position-only
// labels because the book does not assign their readings that way (a holy
// day's second reading may be the gospel)
function lessonSlotsOf(ctx: ComposeContext): LessonSlot[] {
  const group = ctx.lessonGroup;
  const shared = sharedLessonSet(ctx.entry);
  const slots: LessonSlot[] = [];
  for (const { key, label, desc } of SHORT_READING_SLOTS) {
    if (!group || typeof group[key] !== "string") continue;
    slots.push(desc && shared ? { key, label, desc } : { key, label });
  }
  return slots;
}

const SHORT_READING_SLOTS: LessonSlot[] = [
  { key: "first", label: "First Lesson", desc: "OT" },
  { key: "second", label: "Second Lesson", desc: "NT" },
  { key: "third", label: "Third Lesson", desc: undefined },
  { key: "gospel", label: "Gospel", desc: undefined },
];

function composeSection(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedSection {
  const base = { key: section.key, heading: section.heading ?? null };
  switch (section.key) {
    case "opening":
      // noonday and compline keep their whole service in one section with
      // printed menus for psalms, readings and collects
      if (ctx.menuRegions) {
        return { ...base, nodes: composeMenuSection(section, ctx) };
      }
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

// the closing prayers the book titles with a rubric
const PRAYER_TITLES = new Set([
  "The General Thanksgiving",
  "A Prayer of St. Chrysostom",
]);

function keepOccasionalCollect(title: string, weekdayOfDate: number): boolean {
  return (
    OCCASIONAL_COLLECTS.has(title) || title === dayCollectTitle(weekdayOfDate)
  );
}

// personal mode suppresses rubrics by default, they are liturgical
// instructions for a service, not spoken text in solo prayer.
function showRubrics(prefs: OfficePrefs): boolean {
  return prefs.showRubrics && !prefs.personalMode;
}

// the opening-sentence menu is the only opening section with an "At any
// Time" season group.
function isOpeningSentenceSection(section: OfficeSection): boolean {
  return (
    section.key === "opening" &&
    section.items.some(
      (item) =>
        item.kind === "rubric" && /sentences of Scripture/i.test(item.text),
    )
  );
}

type SentenceGroup = { season: string; texts: string[] };

function sentenceGroups(section: OfficeSection): {
  groups: SentenceGroup[];
  leading: OfficeItem[];
} {
  const groups: SentenceGroup[] = [];
  const leading: OfficeItem[] = [];
  let current: SentenceGroup | undefined;
  for (const item of section.items) {
    if (item.kind === "season") {
      current = { season: item.text, texts: [] };
      groups.push(current);
      continue;
    }
    if (current) {
      if (
        item.kind === "text" &&
        !item.text.startsWith("*") &&
        item.text.trim().length > 0
      ) {
        current.texts.push(item.text);
      }
    } else {
      leading.push(item);
    }
  }
  // Evening Prayer prints one flat list with no season headings. It behaves
  // like a single group, whose first sentence is the default.
  if (groups.length === 0) {
    const texts = leading
      .filter(
        (item): item is Extract<OfficeItem, { kind: "text" }> =>
          item.kind === "text" &&
          !item.text.startsWith("*") &&
          item.text.trim().length > 0,
      )
      .map((item) => item.text);
    const rubrics = leading.filter((item) => item.kind !== "text");
    return {
      groups: [{ season: "At any Time", texts }],
      leading: rubrics,
    };
  }
  return { groups, leading };
}

function composeOpeningSentence(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const nodes: ComposedNode[] = [];
  const { groups, leading } = sentenceGroups(section);
  for (const item of leading) {
    const node = convert(item, ctx.prefs);
    if (node) nodes.push(node);
  }
  const override = ctx.prefs.customization?.opening;
  let chosen: string[] = [];
  if (ctx.prefs.fullText) {
    // the reference page's Full text mode prints the whole menu
    chosen = groups.flatMap((group) => group.texts);
  } else if (override === "all") {
    for (const group of groups) {
      if (!keepSeasonGroup(group.season, ctx)) continue;
      chosen.push(...group.texts);
    }
  } else if (typeof override === "string") {
    const match = groups
      .flatMap((group) => group.texts)
      .find((text) => text === override);
    if (match) chosen = [match];
  }
  if (chosen.length === 0) {
    const suggested = suggestedOpeningText(groups, ctx);
    if (suggested) chosen = [suggested];
  }
  for (const text of chosen) {
    nodes.push({ kind: "text", text, speaker: undefined });
  }
  return nodes;
}

// the sentence that renders with no override: the current season's first
// sentence, or the first of the "At any Time" list when no season matches.
function suggestedOpeningText(
  groups: readonly SentenceGroup[],
  ctx: ComposeContext,
): string | undefined {
  const specific = groups.find(
    (group) =>
      group.season !== "At any Time" &&
      keepSeasonGroup(group.season, ctx) &&
      group.texts.length > 0,
  );
  const anyTime = groups.find((group) => group.season === "At any Time");
  return (specific ?? anyTime)?.texts[0];
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
  // Morning and Evening Prayer open with a menu of Scripture sentences. The
  // generic composer below would print every matching group; the office
  // wants one sentence by default.
  if (section.key === "opening" && isOpeningSentenceSection(section)) {
    return composeOpeningSentence(section, ctx);
  }
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

// noonday and compline print alternative psalms, readings and collects inside
// their single section
const MENU_OFFICES = new Set<Office["id"]>(["noonday", "compline"]);

// the printed rubrics that open each menu
const PSALM_MENU_RUBRIC = /one or more of the following Psalms/i;
const READING_MENU_RUBRIC =
  /one of the following, or some other suitable passage/i;
const COLLECT_MENU_RUBRIC = /says one of the following Collect/;
const PSALM_HEAD = /^(?:From )?Psalm (\d+)\s*(.*)/;

// one appointed psalm printed as a menu alternative
type PsalmBlock = {
  // item index of the block's "Psalm N ..." heading
  heading: number;
  from: number;
  to: number;
  psalm: number;
  id: string;
  incipit?: string;
};

// one reading or collect printed as a menu alternative
type MenuBlock = {
  // first and last item indices, inclusive
  from: number;
  to: number;
  id: string;
  label: string;
  menuLabel: string;
  group: string;
  title?: string;
};

// the item ranges of the three printed menus. every marker is an index into
// the section's items; `readingEnd` and `collectEnd` name the first item
// outside the menu, where the office's tail resumes
type MenuRegions = {
  psalmRubric?: number;
  psalms: PsalmBlock[];
  gloriaRubric?: number;
  readingRubric?: number;
  readings: MenuBlock[];
  readingEnd?: number;
  collectRubric?: number;
  collects: MenuBlock[];
  collectEnd?: number;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

// walk the section once and record where each printed menu begins, the
// alternatives it carries, and where it ends
function menuRegions(section: OfficeSection): MenuRegions {
  const items = section.items;
  const regions: MenuRegions = { psalms: [], readings: [], collects: [] };
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== "rubric") continue;
    if (
      regions.psalmRubric === undefined &&
      PSALM_MENU_RUBRIC.test(item.text)
    ) {
      regions.psalmRubric = i;
      for (let j = i + 1; j < items.length; j++) {
        const probe = items[j];
        if (
          probe.kind === "rubric" &&
          /At the end of the Psalms/i.test(probe.text)
        ) {
          regions.gloriaRubric = j;
          break;
        }
        if (probe.kind !== "heading") continue;
        const match = probe.text.match(PSALM_HEAD);
        if (!match) continue;
        const psalm = Number(match[1]);
        let to = j;
        while (items[to + 1]?.kind === "text") to++;
        regions.psalms.push({
          heading: j,
          from: j + 1,
          to,
          psalm,
          id: String(psalm),
          incipit: match[2]?.trim() || undefined,
        });
        j = to;
      }
      i = regions.gloriaRubric ?? i;
      continue;
    }
    if (
      regions.readingRubric === undefined &&
      READING_MENU_RUBRIC.test(item.text)
    ) {
      regions.readingRubric = i;
      // the alternatives follow the rubric, "or this" items between them, and
      // each group reads its printed citation as row label
      const menu: MenuBlock[] = [];
      let j = i + 1;
      while (j < items.length) {
        const probe = items[j];
        if (probe.kind === "option") {
          j++;
          continue;
        }
        if (probe.kind !== "text") break;
        const from = j;
        const citation = probe.citation;
        while (j < items.length && items[j].kind === "text") j++;
        const fallback = `Reading ${menu.length + 1}`;
        const label = citation && citation.length > 0 ? citation : fallback;
        menu.push({
          from,
          to: j - 1,
          id: label,
          label,
          menuLabel: label,
          group: "Appointed",
        });
      }
      regions.readings = menu;
      regions.readingEnd = j;
      i = j - 1;
      continue;
    }
    if (
      regions.collectRubric === undefined &&
      COLLECT_MENU_RUBRIC.test(item.text)
    ) {
      regions.collectRubric = i;
      // collect groups may carry a title rubric such as "A Collect for
      // Saturdays", which prints as the block's heading when chosen
      const menu: MenuBlock[] = [];
      let j = i + 1;
      while (j < items.length) {
        const probe = items[j];
        if (
          probe.kind === "rubric" &&
          probe.text.startsWith("A Collect for ")
        ) {
          const from = j;
          j++;
          while (items[j]?.kind === "text") j++;
          menu.push({
            from,
            to: j - 1,
            id: probe.text,
            label: probe.text,
            menuLabel: probe.text,
            group: "Appointed",
            title: probe.text,
          });
          continue;
        }
        if (probe.kind !== "text") break;
        // each printed collect ends with the people's "Amen.", which bounds
        // the group; the alternatives otherwise run together unmarked
        const from = j;
        const body = probe.text;
        let amen = false;
        while (j < items.length && items[j].kind === "text") {
          amen = items[j].text === "Amen.";
          j++;
          if (amen) break;
        }
        menu.push({
          from,
          to: j - 1,
          id: String(menu.length + 1),
          label: truncate(body, 34),
          menuLabel: truncate(body, 64),
          group: "Appointed",
        });
      }
      regions.collects = menu;
      regions.collectEnd = j;
      i = j - 1;
    }
  }
  return regions;
}

// an override that names no printed option degrades to the fallback id
function chosenOf(
  blocks: readonly { id: string }[],
  override: string | undefined,
  fallback: string,
): string {
  if (override && blocks.some((block) => block.id === override))
    return override;
  return fallback;
}

// the menu rows the inline controls show. the suggested option leads and the
// remaining rows follow the printed order
function officeMenus(ctx: ComposeContext): OfficeMenus | undefined {
  const regions = ctx.menuRegions;
  if (!regions) return undefined;
  const menus: OfficeMenus = {};
  if (regions.psalmRubric !== undefined && regions.psalms.length > 0) {
    const options: MenuChoiceOption[] = [
      {
        id: "suggested",
        label: `All ${regions.psalms.length} psalms`,
        menuLabel: "All psalms",
        group: "Suggested",
      },
      ...regions.psalms.map((block) => ({
        id: block.id,
        label: `Psalm ${block.psalm}`,
        menuLabel: block.incipit
          ? `Psalm ${block.psalm} · ${block.incipit}`
          : `Psalm ${block.psalm} (section)`,
        group: "Appointed",
      })),
    ];
    menus.psalm = { options };
  }
  if (regions.readingRubric !== undefined && regions.readings.length > 1) {
    const [first, ...rest] = regions.readings;
    menus.reading = {
      options: [
        {
          id: "suggested",
          label: first.label,
          menuLabel: first.label,
          group: "Suggested",
        },
        ...rest.map((block) => ({
          id: block.id,
          label: block.label,
          menuLabel: block.menuLabel,
          group: block.group,
        })),
      ],
    };
  }
  if (regions.collectRubric !== undefined && regions.collects.length > 1) {
    const [first, ...rest] = regions.collects;
    const options: MenuChoiceOption[] = [
      {
        id: "suggested",
        label: first.label,
        menuLabel: first.menuLabel,
        group: "Suggested",
      },
      ...rest.map((block) => ({
        id: block.id,
        label: block.label,
        menuLabel: block.menuLabel,
        group: block.group,
      })),
    ];
    // noonday's rubric itself offers the collect of the day as an alternative
    if (ctx.officeId === "noonday" && collectNode(ctx)) {
      options.push({
        id: "day",
        label: "Collect of the Day",
        menuLabel: "The Collect of the Day",
        group: "Seasonal",
      });
    }
    menus.collect = { options };
  }
  if (Object.keys(menus).length === 0) return undefined;
  return menus;
}

// noonday and compline: the single section carries the whole service, and the
// three printed menus recompose around the reader's choices; full text prints
// the entire book page instead, with no pickers
function composeMenuSection(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const regions = ctx.menuRegions ?? { psalms: [], readings: [], collects: [] };
  const prefs = ctx.prefs;
  const customization: OfficeCustomization | undefined = prefs.customization;
  const fullText = prefs.fullText === true;

  const chosenPsalm = fullText
    ? ""
    : chosenOf(regions.psalms, customization?.psalmMenu, "suggested");
  const chosenReading = fullText
    ? ""
    : chosenOf(
        regions.readings,
        customization?.readingMenu,
        regions.readings[0]?.id ?? "",
      );
  const dayCollect =
    !fullText &&
    regions.collectRubric !== undefined &&
    ctx.officeId === "noonday"
      ? collectNode(ctx)
      : undefined;
  const chosenCollect = fullText
    ? ""
    : customization?.collectMenu === "day" && dayCollect
      ? "day"
      : chosenOf(
          regions.collects,
          customization?.collectMenu,
          regions.collects[0]?.id ?? "",
        );

  const nodes: ComposedNode[] = [];
  const items = section.items;
  let inPrayerMenu = false;
  let skipOptionText = false;
  let region: "main" | "psalms" | "readings" | "collects" = "main";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // a menu ends at its first item outside the alternatives. the terminating
    // rubric returns to the main flow and is handled there
    if (region === "readings" && i >= (regions.readingEnd ?? items.length)) {
      region = "main";
    }
    if (region === "collects" && i >= (regions.collectEnd ?? items.length)) {
      region = "main";
    }

    if (region === "main") {
      if (item.kind === "rubric") {
        skipOptionText = false;
        if (i === regions.psalmRubric) {
          region = "psalms";
          const node = convert(item, prefs);
          if (node) nodes.push(node);
          if (!fullText) nodes.push({ kind: "menu", menu: "psalm" });
          continue;
        }
        if (i === regions.readingRubric) {
          region = "readings";
          const node = convert(item, prefs);
          if (node) nodes.push(node);
          if (!fullText) nodes.push({ kind: "menu", menu: "reading" });
          continue;
        }
        if (i === regions.collectRubric) {
          region = "collects";
          const node = convert(item, prefs);
          if (node) nodes.push(node);
          if (!fullText) nodes.push({ kind: "menu", menu: "collect" });
          if (chosenCollect === "day" && dayCollect !== undefined) {
            nodes.push({ kind: "heading", text: "The Collect of the Day" });
            nodes.push(dayCollect);
          }
          continue;
        }
        if (/one of the following prayers?/i.test(item.text)) {
          inPrayerMenu = true;
        } else {
          inPrayerMenu = false;
        }
        // compline closes with the Song of Simeon and its antiphon; the rubric
        // names the antiphon and canticle, so label the canticle before its verses
        if (
          ctx.officeId === "compline" &&
          /service concludes with the Song of Simeon/i.test(item.text)
        ) {
          const node = convert(item, prefs);
          if (node) nodes.push(node);
          continue;
        }
        const node = convert(item, prefs);
        if (node) nodes.push(node);
        continue;
      }
      if (item.kind === "option") {
        // full text prints the whole page, so the compline prayer pair keeps
        // both alternatives
        if (inPrayerMenu && !fullText) skipOptionText = true;
        continue;
      }
      if (skipOptionText) continue;
      // label the Nunc dimittis canticle itself before its verses
      if (
        ctx.officeId === "compline" &&
        item.kind === "text" &&
        item.text.startsWith("Lord, you now have set your servant free")
      ) {
        nodes.push({ kind: "heading", text: "Nunc dimittis" });
      }
      const node = convert(item, prefs);
      if (node) nodes.push(node);
      continue;
    }

    if (region === "psalms") {
      if (item.kind === "rubric") {
        // the Glory rubric ends the psalm menu; the Glory text follows in main
        region = "main";
        const node = convert(item, prefs);
        if (node) nodes.push(node);
        continue;
      }
      if (item.kind === "heading") {
        const block = regions.psalms.find((b) => b.heading === i);
        if (block) {
          const keep =
            fullText || chosenPsalm === "suggested" || chosenPsalm === block.id;
          if (keep) {
            const verseItems = items
              .slice(block.from, block.to + 1)
              .filter((it): it is Extract<OfficeItem, { kind: "text" }> => {
                return it.kind === "text";
              });
            const verses: PsalmPassage["verses"] = verseItems.map(
              (it, index) => ({ number: index + 1, text: it.text }),
            );
            nodes.push({
              kind: "psalm",
              passage: { psalm: block.psalm, verses },
              citation: block.id,
              incipit: block.incipit,
            });
          }
          i = block.to;
        }
        continue;
      }
      const node = convert(item, prefs);
      if (node) nodes.push(node);
      continue;
    }

    if (region === "readings") {
      const block = regions.readings.find((b) => b.from === i);
      if (block) {
        if (fullText || block.id === chosenReading) {
          const kept: ComposedNode[] = [];
          for (let j = block.from; j <= block.to; j++) {
            const node = convert(items[j], prefs);
            if (node) kept.push(node);
          }
          // the book prints the citation at the end of the passage, before
          // the people's response
          const responses = new Set([
            "Thanks be to God.",
            "The Word of the Lord.",
          ]);
          for (let k = kept.length - 1; k >= 0; k--) {
            const node = kept[k];
            if (node.kind === "text" && !responses.has(node.text)) {
              node.citation = block.id;
              break;
            }
          }
          nodes.push(...kept);
        }
        i = block.to;
      }
      continue;
    }

    if (region === "collects") {
      const block = regions.collects.find((b) => b.from === i);
      if (block) {
        if (fullText || block.id === chosenCollect) {
          // a collect prints in the fixed-collect voice, as the closing
          // prayers of morning and evening do; its title rides on the node
          // rather than a separate heading
          const lines: string[] = [];
          const from = block.title ? block.from + 1 : block.from;
          for (let j = from; j <= block.to; j++) {
            const probe = items[j];
            if (probe.kind === "text") lines.push(probe.text);
          }
          nodes.push({
            kind: "fixed-collect",
            text: lines.join("\n"),
            title: block.title,
          });
        }
        i = block.to;
      }
    }
  }
  return nodes;
}

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
  const choice = invitatoryChoice(ctx);
  const nodes: ComposedNode[] = [];
  let keep = true;
  let skipPhosBlock = false;
  const evening = !ctx.officeId.startsWith("morning");
  // before the invited psalm: the versicle and antiphon are kept. once a
  // psalm heading appears, only the chosen psalm's text is kept.
  for (const item of section.items) {
    if (skipPhosBlock) {
      if (item.kind === "rubric" && item.text.startsWith("Then follows")) {
        skipPhosBlock = false;
        const node = convert(item, ctx.prefs);
        if (node) nodes.push(node);
      }
      continue;
    }
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
      if (item.text.startsWith("In Easter Week")) {
        if (showRubrics(ctx.prefs))
          nodes.push({ kind: "rubric", text: item.text });
        continue;
      }
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
      const psalm = invitatoryPsalmOf(item.text);
      if (psalm) {
        keep = ctx.prefs.fullText || psalm === choice;
        if (keep) {
          const node = convert(item, ctx.prefs);
          if (node) nodes.push(node);
        }
        continue;
      }
      if (
        evening &&
        item.text.startsWith("O Gracious Light") &&
        !ctx.prefs.fullText &&
        (choice === "venite" || choice === "jubilate")
      ) {
        for (const invitatoryItem of invitatoryPsalmItems(choice, ctx.rite)) {
          const node = convert(invitatoryItem, ctx.prefs);
          if (node) nodes.push(node);
        }
        skipPhosBlock = true;
        continue;
      }
      keep = true;
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

function invitatoryChoice(
  ctx: ComposeContext,
): "venite" | "jubilate" | "pascha" | "phos" {
  if (ctx.officeId.startsWith("morning")) {
    const explicit = ctx.prefs.customization?.invitatory;
    if (explicit) return explicit;
    return ctx.slot.week.kind === "easter-week" ? "pascha" : "venite";
  }
  const explicit = ctx.prefs.customization?.invitatory;
  if (explicit === "venite" || explicit === "jubilate") return explicit;
  return "phos";
}

// the printed default: Venite, replaced by Pascha nostrum in Easter Week.
function defaultInvitatory(
  ctx: ComposeContext,
): "venite" | "jubilate" | "pascha" | "phos" {
  if (!ctx.officeId.startsWith("morning")) return "phos";
  return ctx.slot.week.kind === "easter-week" ? "pascha" : "venite";
}

function invitatoryPsalmOf(
  text: string,
): "venite" | "jubilate" | "pascha" | undefined {
  if (text.startsWith("Venite")) return "venite";
  if (text.startsWith("Jubilate")) return "jubilate";
  if (text.includes("Pascha nostrum")) return "pascha";
  return undefined;
}

function invitatoryPsalmItems(
  choice: "venite" | "jubilate",
  rite: OfficeRite,
): OfficeItem[] {
  if (choice === "venite") {
    if (rite === "One") {
      return [
        { kind: "heading", text: "Venite", citation: "Psalm 95:1-7" },
        {
          kind: "text",
          text: "O come, let us sing unto the Lord; let us heartily rejoice in the strength of our salvation.",
        },
        {
          kind: "text",
          text: "Let us come before his presence with thanksgiving and show ourselves glad in him with psalms.",
        },
        {
          kind: "text",
          text: "For the Lord is a great God, and a great King above all gods.",
        },
        {
          kind: "text",
          text: "In his hand are the corners of the earth, and the strength of the hills is his also.",
        },
        {
          kind: "text",
          text: "The sea is his, and he made it, and his hands prepared the dry land.",
        },
        {
          kind: "text",
          text: "O come, let us worship and fall down, and kneel before the Lord our Maker.",
        },
        {
          kind: "text",
          text: "For he is the Lord our God, and we are the people of his pasture and the sheep of his hand.",
        },
        {
          kind: "text",
          text: "O worship the Lord in the beauty of holiness; let the whole earth stand in awe of him.",
        },
        {
          kind: "text",
          text: "For he cometh, for he cometh to judge the world and with righteousness to judge the world and the peoples with his truth.",
        },
      ];
    }
    return [
      { kind: "heading", text: "Venite", citation: "Psalm 95:1-7" },
      {
        kind: "text",
        text: "Come let us sing to the Lord; let us shout for joy to the Rock of our salvation.",
      },
      {
        kind: "text",
        text: "Let us come before his presence with thanksgiving and raise a loud shout to him with psalms.",
      },
      {
        kind: "text",
        text: "For the Lord is a great God, and a great King above all gods.",
      },
      {
        kind: "text",
        text: "In his hand are the caverns of the earth, and the heights of the hills are his also.",
      },
      {
        kind: "text",
        text: "The sea is his, for he made it, and his hands have molded the dry land.",
      },
      {
        kind: "text",
        text: "Come, let us bow down, and bend the knee, and kneel before the Lord our Maker.",
      },
      {
        kind: "text",
        text: "For he is our God, and we are the people of his pasture and the sheep of his hand. Oh, that today you would hearken to his voice!",
      },
    ];
  }
  if (rite === "One") {
    return [
      { kind: "heading", text: "Jubilate", citation: "Psalm 100" },
      {
        kind: "text",
        text: "Be joyful in the Lord, all ye lands; serve the Lord with gladness and come before his presence with a song.",
      },
      {
        kind: "text",
        text: "Be ye sure that the Lord he is God; it is he that hath made us and we ourselves; we are his people and the sheep of his pasture.",
      },
      {
        kind: "text",
        text: "O go your way into his gates with thanksgiving and into his courts with praise; be thankful unto him and speak good of his Name.",
      },
      {
        kind: "text",
        text: "For the Lord is gracious; his mercy is everlasting; and his truth endureth from generation to generation.",
      },
    ];
  }
  return [
    { kind: "heading", text: "Jubilate", citation: "Psalm 100" },
    {
      kind: "text",
      text: "Be joyful in the Lord, all you lands; serve the Lord with gladness and come before his presence with song.",
    },
    {
      kind: "text",
      text: "Know this: The Lord himself is God; he himself has made us, and we are his; we are his people and the sheep of his pasture.",
    },
    {
      kind: "text",
      text: "Enter his gates with thanksgiving; go into his courts with praise; give thanks to him and call upon his Name.",
    },
    {
      kind: "text",
      text: "For the Lord is good; his mercy is everlasting; and his faithfulness endures from age to age.",
    },
  ];
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
// readings and canticles interleave as the book directs: after the first
// reading, after the second, then (with three lessons) the Gospel. The
// office JSON's canticle menu is ignored; canticle text comes from the
// catalog so the suggested table can choose it.
function composeLessons(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  if (ctx.prefs.fullText) return composeLessonsFull(section, ctx);
  const all = lessonList(ctx);
  // a lesson's optional alternate belongs to the same reading slot, so it
  // does not add a canticle.
  const groups = ([1, 2, 3] as const)
    .map((number) => all.filter((lesson) => lesson.number === number))
    .filter((group) => group.length > 0);
  const maxCanticles = Math.min(2, groups.length);

  const nodes: ComposedNode[] = [];
  let nextGroup = 0;
  let canticleIndex = 0;
  let inCanticleMenu = false;
  for (const item of section.items) {
    if (item.kind === "heading") {
      // the first heading opens the printed canticle menu; from here the
      // section's own headings and text are replaced by composed nodes.
      inCanticleMenu = true;
      canticleIndex += 1;
      if (canticleIndex <= maxCanticles) {
        const slot = canticleIndex === 1 ? 1 : 2;
        const number = canticleNumberForSlot(ctx, slot, groups.length);
        const passage =
          number === null ? null : (canticlePassage(number) ?? null);
        // the slot always emits a node so its control stays reachable even
        // when the reader chose None
        nodes.push({
          kind: "canticle",
          passage,
          slot,
          suggested: canticleIsSuggested(ctx, slot),
        });
      }
      if (nextGroup < groups.length) {
        for (const lesson of groups[nextGroup]) {
          nodes.push({ kind: "reading", lesson });
        }
        nextGroup += 1;
      }
      continue;
    }
    if (inCanticleMenu) continue;
    if (item.kind === "season") continue;
    if (item.kind === "text" && item.text.includes("A Reading (Lesson) from")) {
      if (groups.length > 0) {
        for (const lesson of groups[0]) {
          nodes.push({ kind: "reading", lesson });
        }
        nextGroup = 1;
      }
      continue;
    }
    const node = convert(item, ctx.prefs);
    if (node) nodes.push(node);
  }
  return nodes;
}

// full text reference mode: the office as printed, with all lessons at the
// reading placeholder and the whole canticle menu after them.
function composeLessonsFull(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const lessons = lessonList(ctx);
  const nodes: ComposedNode[] = [];
  let region: "reading" | "canticles" = "reading";
  for (const item of section.items) {
    if (
      item.kind === "text" &&
      item.text.includes("A Reading (Lesson) from") &&
      lessons.length > 0
    ) {
      nodes.push({ kind: "lessons", lessons });
      continue;
    }
    if (item.kind === "heading") {
      region = "canticles";
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
      continue;
    }
    if (region === "reading" && item.kind === "season") continue;
    const node = convert(item, ctx.prefs);
    if (node) nodes.push(node);
  }
  return nodes;
}

// the canticle for a reading slot: the reader's explicit choice (a number or
// null for "None"), otherwise the p. 144 suggested canticle for the day.
function canticleNumberForSlot(
  ctx: ComposeContext,
  slot: 1 | 2,
  readingCount: number,
): number | null {
  const key = slot === 1 ? "canticle1" : "canticle2";
  const override = ctx.prefs.customization?.[key];
  if (override !== undefined) return override;
  return suggestedCanticleForSlot(ctx, slot, readingCount);
}

function suggestedCanticleForSlot(
  ctx: ComposeContext,
  slot: 1 | 2,
  readingCount: number,
): number | null {
  const [first, second] = suggestedCanticles({
    office: isMorningOffice(ctx.officeId) ? "morning" : "evening",
    rite: ctx.rite,
    weekday: weekday(ctx.date),
    season: ctx.season,
    isFeast: ctx.holyDay !== undefined,
  });
  // if only one reading is used at Evening Prayer, the table's footnote
  // directs the Magnificat instead of the weekday's first canticle.
  if (slot === 1 && readingCount === 1 && isEveningOffice(ctx.officeId)) {
    return ctx.rite === "One" ? 3 : 15;
  }
  return slot === 1 ? first : second;
}

function canticleIsSuggested(ctx: ComposeContext, slot: 1 | 2): boolean {
  const key = slot === 1 ? "canticle1" : "canticle2";
  return ctx.prefs.customization?.[key] === undefined;
}

function composeSuffragesB(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const collect = collectNode(ctx);
  const nodes: ComposedNode[] = [];
  // when A is the chosen suffrages, B's versicles are skipped and only the
  // shared tail (collects, mission prayer, thanksgiving, closing) runs.
  let inTail = suffragesChoice(ctx) === "b";
  // Within each option menu only the first alternative (text + its response)
  // is kept; occasional collects are trimmed to the day-appropriate ones.
  let menu: "prayers" | "mission" | "thanksgiving" | "closing" = "prayers";
  let keepGroup = true;
  let firstKept = false;
  let collectTitle: string | undefined;
  let collectBuf: string[] = [];
  for (const item of section.items) {
    if (!inTail) {
      if (
        item.kind === "rubric" &&
        /The Officiant then says one or more of the following Collects/i.test(
          item.text,
        )
      ) {
        inTail = true;
      } else {
        continue;
      }
    }
    if (item.kind === "rubric") {
      if (menu === "thanksgiving") firstKept = false;
      const text = item.text;
      // block titles the book prints as rubrics: the collect slot and the
      // closing prayers rank as headings, never hidden as personal-mode rubrics
      if (PRAYER_TITLES.has(text)) {
        flushCollectBuf(nodes, collectBuf, collectTitle);
        collectBuf = [];
        collectTitle = undefined;
        nodes.push({ kind: "heading", text });
        continue;
      }
      if (text === "The Collect of the Day") {
        flushCollectBuf(nodes, collectBuf, collectTitle);
        collectBuf = [];
        collectTitle = undefined;
        if (collect) {
          nodes.push({ kind: "heading", text: item.text });
          nodes.push(collect);
        }
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

// the reading positions an office keeps, resolved from the reader's stored
// choice, plus whether Evening's First Reading belongs to the alternate
// year (p. 934, two Readings at both offices). a missing key keeps the
// whole day, and a stored set with nothing in common with the day degrades
// to keeping the whole day, the way stale choices fall back to the printed
// default.
type ReadingsSpec = {
  keep: Set<LessonSlot["key"]>;
  swapFirst: boolean;
};

const READING_KEYS: LessonSlot["key"][] = [
  "first",
  "second",
  "third",
  "gospel",
];

const READING_NUMBERS: Record<LessonSlot["key"], 1 | 2 | 3> = {
  first: 1,
  second: 2,
  third: 3,
  gospel: 3,
};

// whether the day's entry is one shared set for both offices (the year
// tables) rather than a morning/evening split (holy days, special
// occasions, appointed eves, Palm Sunday's own day)
function sharedLessonSet(entry: DolEntry | undefined): boolean {
  return (
    entry !== undefined &&
    entry.lessons.morning === undefined &&
    entry.lessons.evening === undefined
  );
}

function resolveReadings(ctx: ComposeContext): ReadingsSpec {
  const group = ctx.lessonGroup;
  if (!group) return { keep: new Set(), swapFirst: false };
  const present = READING_KEYS.filter((key) => typeof group[key] === "string");
  const keepAll = new Set(present);
  const stored = ctx.prefs.customization?.readings;
  if (stored === undefined) return { keep: keepAll, swapFirst: false };
  const wanted = new Set<number>([...stored].map(Number));
  const keep = new Set(
    present.filter((key) => wanted.has(READING_NUMBERS[key])),
  );
  const swapFirst =
    keep.size > 0 &&
    stored === "12" &&
    isEveningOffice(ctx.officeId) &&
    sharedLessonSet(ctx.entry);
  if (keep.size === 0) return { keep: keepAll, swapFirst: false };
  return { keep, swapFirst };
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
  // full text prints the book as it is, so the reader's readings choice
  // never filters or swaps there
  const spec = ctx.prefs.fullText ? undefined : resolveReadings(ctx);
  // p. 934: two Readings at both offices put the alternate year's Old
  // Testament First Reading at Evening Prayer
  let alternateFirst: { first?: string; altFirst?: string } | undefined;
  if (spec?.swapFirst) {
    const swapped = entryForAlternateYear(ctx.slot);
    if (typeof swapped?.lessons.first === "string") {
      alternateFirst = {
        first: swapped.lessons.first,
        altFirst: swapped.lessons.altFirst,
      };
    }
  }
  for (const { key, alt, label, number } of fields) {
    if (spec && !spec.keep.has(key)) continue;
    let ref = group[key];
    if (typeof ref !== "string") continue;
    if (key === "first" && typeof alternateFirst?.first === "string") {
      ref = alternateFirst.first;
    }
    lessons.push({ number, label, ref });
    if (alt === null || !ctx.prefs.showAlternates) continue;
    const swappedAlt = key === "first" ? alternateFirst?.altFirst : undefined;
    const alternate =
      key === "first" && typeof swappedAlt === "string"
        ? swappedAlt
        : group[alt];
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
  // holy day collects carry the feast slug for the title link
  const slug = found.section === "holy-days" ? ctx.litSlot.holyDay : undefined;
  return { kind: "collect", passage, slug };
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
