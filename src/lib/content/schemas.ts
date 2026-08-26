import { z } from "zod";
import type {
  Canticle,
  Collect,
  CollectRite,
  CollectSection,
  DolEntry,
  DolLessonGroup,
  Office,
  OfficeId,
  Psalm,
} from "./types";

const lessonGroupSchema = z.object({
  first: z.string().optional(),
  second: z.string().optional(),
  third: z.string().optional(),
  gospel: z.string().optional(),
  altFirst: z.string().optional(),
  altSecond: z.string().optional(),
  altGospel: z.string().optional(),
}) satisfies z.ZodType<DolLessonGroup>;

export const dolEntrySchema = z.object({
  year: z.string().optional(),
  season: z.string().optional(),
  week: z.string().optional(),
  day: z.string(),
  title: z.string().optional(),
  psalms: z.object({
    morning: z.array(z.string()).optional(),
    evening: z.array(z.string()).optional(),
  }),
  lessons: z.object({
    morning: lessonGroupSchema.optional(),
    evening: lessonGroupSchema.optional(),
    first: z.string().optional(),
    second: z.string().optional(),
    third: z.string().optional(),
    gospel: z.string().optional(),
    altFirst: z.string().optional(),
    altSecond: z.string().optional(),
    altGospel: z.string().optional(),
  }),
  notes: z.array(z.string()).optional(),
}) satisfies z.ZodType<DolEntry>;

export const dolYearSchema = z.array(dolEntrySchema);

export const psalmCitationSchema = z.object({
  psalm: z.number(),
  optional: z.boolean().optional(),
  verses: z.object({ start: z.number(), end: z.number() }).optional(),
  lengthen: z.object({ start: z.number(), end: z.number() }).optional(),
  extend: z.object({ start: z.number(), end: z.number() }).optional(),
});

const officeSpeakerSchema = z.enum(["officiant", "people", "all"]);

const officeHeadingSchema = z.object({
  kind: z.literal("heading"),
  text: z.string(),
  citation: z.string().optional(),
});

const officeSeasonSchema = z.object({
  kind: z.literal("season"),
  text: z.string(),
});

const officeRubricSchema = z.object({
  kind: z.literal("rubric"),
  text: z.string(),
});

const officeTextSchema = z.object({
  kind: z.literal("text"),
  text: z.string(),
  speaker: officeSpeakerSchema.optional(),
  citation: z.string().optional(),
});

const officeOptionSchema = z.object({
  kind: z.literal("option"),
  text: z.string(),
});

const officeItemSchema = z.discriminatedUnion("kind", [
  officeHeadingSchema,
  officeSeasonSchema,
  officeRubricSchema,
  officeTextSchema,
  officeOptionSchema,
]);

const officeSectionKeySchema = z.enum([
  "opening",
  "confession",
  "invitatory",
  "psalms",
  "lessons",
  "creed",
  "prayers",
  "suffrages-a",
  "suffrages-b",
  "selection-from-the-psalter",
  "bible-reading",
  "canticle",
  "blessing-or-dismissal",
]);

const officeSectionSchema = z.object({
  key: officeSectionKeySchema,
  heading: z.string().nullable().optional(),
  items: z.array(officeItemSchema),
});

const officeSchema = z.object({
  id: z.custom<OfficeId>(),
  name: z.string(),
  rite: z.enum(["One", "Two"]).nullable().optional(),
  sections: z.array(officeSectionSchema),
}) satisfies z.ZodType<Office>;

export const officesSchema = z.record(z.custom<OfficeId>(), officeSchema);

const psalmPartSchema = z.object({
  title: z.string().nullable().optional(),
  stanzas: z.record(z.string(), z.string()).optional(),
  verses: z.record(z.string(), z.string()),
}) satisfies z.ZodType<import("./types").PsalmPart>;

export const psalterSchema = z.record(
  z.string(),
  z.object({ parts: z.array(psalmPartSchema) }),
) satisfies z.ZodType<Record<string, Psalm>>;

const canticleSectionSchema = z.object({
  title: z.string().nullable().optional(),
  verses: z.array(z.string()),
}) satisfies z.ZodType<import("./types").CanticleSection>;

export const canticlesSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    latin: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    sections: z.array(canticleSectionSchema),
  }),
) satisfies z.ZodType<Record<string, Canticle>>;

const collectSchema = z.object({
  title: z.string(),
  text: z.string(),
  notes: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .optional(),
}) satisfies z.ZodType<Collect>;

export const collectsSchema = z.record(
  // SAFETY: z.enum requires a tuple; this array is an exhaustive list of CollectRite values.
  z.enum(["traditional", "contemporary"] as [CollectRite, ...CollectRite[]]),
  z.record(
    // SAFETY: z.enum requires a tuple; this array is an exhaustive list of CollectSection values.
    z.enum([
      "church-year",
      "holy-days",
      "common-of-saints",
      "various-occasions",
    ] as [CollectSection, ...CollectSection[]]),
    z.array(collectSchema),
  ),
) satisfies z.ZodType<Record<CollectRite, Record<CollectSection, Collect[]>>>;

const kjvVerseSchema = z.string();

export const kjvChapterSchema = z.record(z.string(), kjvVerseSchema);

export const kjvBookSchema = z.object({
  book: z.string(),
  abbrev: z.string(),
  testament: z.enum(["OT", "NT"]),
  chapters: z.number().int().positive(),
  verses: z.record(z.string(), kjvChapterSchema),
}) satisfies z.ZodType<import("./types").KjvBook>;

export const kjvBooksSchema = z.record(z.string(), kjvBookSchema);
