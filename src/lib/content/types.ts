export type PsalmCitation = {
  psalm: number;
  optional?: boolean;
  verses?: { start: number; end: number };
  lengthen?: { start: number; end: number };
  extend?: { start: number; end: number };
};

export type Half = "a" | "b";

export type VerseCoord = {
  chapter: number;
  verse: number;
  half?: Half;
};

export type VerseRange = {
  from: VerseCoord;
  to?: VerseCoord;
  optional?: boolean;
};

export type LessonRef = {
  book: string;
  ranges: VerseRange[];
};

export type DolLessonGroup = {
  first?: string;
  second?: string;
  third?: string;
  gospel?: string;
  altFirst?: string;
  altSecond?: string;
  altGospel?: string;
};

export type DolEntry = {
  year?: string;
  season?: string;
  week?: string;
  day: string;
  title?: string;
  psalms: {
    morning?: string[];
    evening?: string[];
  };
  lessons: {
    morning?: DolLessonGroup;
    evening?: DolLessonGroup;
    first?: string;
    second?: string;
    third?: string;
    gospel?: string;
    altFirst?: string;
    altSecond?: string;
    altGospel?: string;
  };
  notes?: string[];
};

export type PsalmPart = {
  title?: string | null;
  stanzas?: Record<string, string>;
  verses: Record<string, string>;
};

export type Psalm = {
  parts: PsalmPart[];
};

// a passage to render: a single psalm citation resolves to verses.
export type PsalmPassage = {
  psalm: number;
  verses: { number: number; text: string; stanza?: string }[];
};

export type CanticleSection = {
  title?: string | null;
  verses: string[];
};

export type Canticle = {
  title: string;
  latin?: string | null;
  source?: string | null;
  note?: string | null;
  sections: CanticleSection[];
};

// a passage to render: a single canticle, optionally clipped to sections.
export type CanticlePassage = {
  number: number;
  title: string;
  sections: CanticleSection[];
};

export type CollectRite = "traditional" | "contemporary";

export type CollectSection =
  | "church-year"
  | "holy-days"
  | "common-of-saints"
  | "various-occasions";

export type Collect = {
  title: string;
  text: string;
  notes?: string | null;
};

// a collect to render: a rite/section/title resolves to its full text.
export type CollectPassage = {
  rite: CollectRite;
  section: CollectSection;
  title: string;
  text: string;
  notes?: string | null;
};

export type OfficeId =
  | "morning-rite-one"
  | "morning-rite-two"
  | "evening-rite-one"
  | "evening-rite-two"
  | "noonday"
  | "owe"
  | "compline";

export type OfficeSpeaker = "officiant" | "people" | "all";

export type OfficeItem =
  | { kind: "heading"; text: string; citation?: string }
  | { kind: "season"; text: string }
  | { kind: "rubric"; text: string }
  | { kind: "text"; text: string; speaker?: OfficeSpeaker; citation?: string }
  | { kind: "option"; text: string };

export type OfficeSectionKey =
  | "opening"
  | "confession"
  | "invitatory"
  | "psalms"
  | "lessons"
  | "creed"
  | "prayers"
  | "suffrages-a"
  | "suffrages-b"
  | "selection-from-the-psalter"
  | "bible-reading"
  | "canticle"
  | "blessing-or-dismissal";

export type OfficeSection = {
  key: OfficeSectionKey;
  heading?: string | null;
  items: OfficeItem[];
};

export type Office = {
  id: OfficeId;
  name: string;
  rite?: "One" | "Two" | null;
  sections: OfficeSection[];
};

// an office to render: its id resolves to its full text.
export type OfficePassage = Office;
