import type { PsalmCitation } from "./types";

const citation =
  /^(\[?)(\d{1,3})(\]?)(?::(\d{1,3})(?:[-–](\d{1,3}))?)?(?:\((\d{1,3})(?:[-–](\d{1,3}))?\))?(?:(\d{1,3})(?:[-–](\d{1,3}))?)?$/;

export function parsePsalmCitation(input: string): PsalmCitation | null {
  const m = citation.exec(input.trim());
  if (!m) return null;
  if ((m[1] === "[") !== (m[3] === "]")) return null;
  const psalm = Number(m[2]);
  if (m[1] === "[" && (m[4] || m[6] || m[8])) return null;
  const result: PsalmCitation = { psalm };
  if (m[1] === "[") result.optional = true;
  if (m[4]) {
    result.verses = { start: Number(m[4]), end: Number(m[5] ?? m[4]) };
  }
  if (m[6]) {
    result.lengthen = { start: Number(m[6]), end: Number(m[7] ?? m[6]) };
  }
  if (m[8]) {
    result.extend = { start: Number(m[8]), end: Number(m[9] ?? m[8]) };
  }
  return result;
}
