import { z } from "zod";
import type { DolEntry, DolLessonGroup } from "./types";

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
