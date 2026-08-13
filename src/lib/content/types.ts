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
