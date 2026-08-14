import { z } from "zod";
import type { DolEntry, DolLessonGroup, Office, OfficeId } from "./types";

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
