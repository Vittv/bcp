import type { Half, LessonRef, VerseRange } from "./types";

const SINGLE_BOOKS = [
  "Gen",
  "Exod",
  "Lev",
  "Num",
  "Deut",
  "Josh",
  "Judg",
  "Ruth",
  "1 Sam",
  "2 Sam",
  "1 Kgs",
  "2 Kgs",
  "1 Chr",
  "2 Chr",
  "Ezra",
  "Neh",
  "Esth",
  "Job",
  "Prov",
  "Eccl",
  "Song",
  "Isa",
  "Jer",
  "Lam",
  "Ezek",
  "Dan",
  "Hos",
  "Joel",
  "Amos",
  "Obad",
  "Jonah",
  "Mic",
  "Nah",
  "Hab",
  "Zeph",
  "Hag",
  "Zech",
  "Mal",
  "1 Esd",
  "2 Esd",
  "Tob",
  "Jdt",
  "Wis",
  "Sir",
  "Bar",
  "1 Macc",
  "2 Macc",
  "Matt",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Rom",
  "1 Cor",
  "2 Cor",
  "Gal",
  "Eph",
  "Phil",
  "Col",
  "1 Thess",
  "2 Thess",
  "1 Tim",
  "2 Tim",
  "Titus",
  "Phlm",
  "Heb",
  "Jas",
  "1 Pet",
  "2 Pet",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Rev",
];

const ALIASES = new Map<string, string>([
  ["1 KINGS", "1 Kgs"],
  ["2 KINGS", "2 Kgs"],
  ["1 CHRONICLES", "1 Chr"],
  ["2 CHRONICLES", "2 Chr"],
  ["JAMES", "Jas"],
  ["ECCLES", "Eccl"],
  ["ECCLESIASTICUS", "Sir"],
  ["PSALMS", "Ps"],
  ["PS", "Ps"],
]);

const SINGLE_CHAPTER_BOOKS = new Set([
  "Obad",
  "Phlm",
  "2 John",
  "3 John",
  "Jude",
]);

function canonicalBook(token: string): string | null {
  const upper = token.toUpperCase();
  const alias = ALIASES.get(upper);
  if (alias) return alias;
  return SINGLE_BOOKS.find((b) => b.toUpperCase() === upper) ?? null;
}

type Token =
  | { type: "paren"; open: boolean }
  | { type: "sep" }
  | { type: "dash" }
  | { type: "colon"; chapter: number }
  | { type: "coord"; verse: number; half?: Half };

export type LessonParse =
  | { ok: true; ref: LessonRef }
  | { ok: false; error: string };

export function parseLessonRef(input: string): LessonParse {
  const trimmed = input.trim();
  const bookMatch = /^(\d ?[A-Za-z]+|[A-Za-z]+)(?: |$)/.exec(trimmed);
  if (!bookMatch) return { ok: false, error: "no book abbreviation" };
  const book = canonicalBook(bookMatch[1]);
  if (!book) return { ok: false, error: `unknown book '${bookMatch[1]}'` };
  const rest = trimmed.slice(bookMatch[0].length).trim();
  if (!rest) return { ok: false, error: "no reference" };

  const tokens: Token[] = [];
  let i = 0;
  while (i < rest.length) {
    const ch = rest[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "(" || ch === ")") {
      tokens.push({ type: "paren", open: ch === "(" });
      i++;
      continue;
    }
    if (ch === ";" || ch === "," || ch === ".") {
      tokens.push({ type: "sep" });
      i++;
      continue;
    }
    if (ch === "–" || ch === "-") {
      tokens.push({ type: "dash" });
      i++;
      continue;
    }
    if (/\d/.test(ch)) {
      const m = /^(\d{1,2})(:)?([ab])?/.exec(rest.slice(i));
      if (!m) return { ok: false, error: "bad number token" };
      const n = Number(m[1]);
      if (m[2] === ":") tokens.push({ type: "colon", chapter: n });
      else
        tokens.push({
          type: "coord",
          verse: n,
          half: m[3] as Half | undefined,
        });
      i += m[0].length;
      continue;
    }
    return { ok: false, error: `unexpected character '${ch}'` };
  }

  const problems: string[] = [];
  const ranges: VerseRange[] = [];
  const singleChapter = SINGLE_CHAPTER_BOOKS.has(book);
  let currentChapter: number | null = singleChapter ? 1 : null;
  let endChapter: number | null = null;
  let pending: { chapter: number; verse: number; half?: Half } | null = null;
  let expectingEnd = false;
  let parenDepth = 0;

  const flushPending = (optional: boolean) => {
    if (pending && !expectingEnd) {
      ranges.push({ from: pending, optional });
      pending = null;
    }
  };

  for (const t of tokens) {
    switch (t.type) {
      case "paren":
        if (t.open) {
          if (expectingEnd) {
            problems.push("unexpected '(' after a dash");
            expectingEnd = false;
          }
          flushPending(false);
          parenDepth++;
        } else {
          flushPending(true);
          if (parenDepth === 0) problems.push("unmatched ')'");
          else parenDepth--;
        }
        break;
      case "sep":
        flushPending(parenDepth > 0);
        break;
      case "dash":
        if (!pending) problems.push("'-' without a start verse");
        else if (expectingEnd) problems.push("double '-'");
        else expectingEnd = true;
        break;
      case "colon":
        if (expectingEnd && pending) {
          endChapter = t.chapter;
        } else {
          flushPending(parenDepth > 0);
          currentChapter = t.chapter;
          endChapter = null;
        }
        break;
      case "coord": {
        if (currentChapter === null) {
          problems.push(`verse ${t.verse} appears before any chapter`);
          break;
        }
        if (expectingEnd) {
          if (!pending) {
            problems.push("'-' without a start verse");
            expectingEnd = false;
            break;
          }
          const to = {
            chapter: endChapter ?? pending.chapter,
            verse: t.verse,
            half: t.half,
          };
          ranges.push({ from: pending, to, optional: parenDepth > 0 });
          currentChapter = to.chapter;
          pending = null;
          expectingEnd = false;
          endChapter = null;
        } else {
          pending = { chapter: currentChapter, verse: t.verse, half: t.half };
        }
        break;
      }
    }
  }
  flushPending(parenDepth > 0);
  if (parenDepth !== 0) problems.push(`unmatched '(' (${parenDepth})`);
  if (ranges.length === 0) problems.push("no verse ranges parsed");

  if (problems.length > 0) return { ok: false, error: problems.join("; ") };
  return { ok: true, ref: { book, ranges } };
}

export function formatLessonRef(ref: LessonRef): string {
  const parts = ref.ranges.map((r) => formatRange(r));
  return `${ref.book} ${parts.join("; ")}`;
}

function formatRange(r: VerseRange): string {
  const from = `${r.from.chapter}:${r.from.verse}${r.from.half ?? ""}`;
  let inner: string;
  if (!r.to) {
    inner = from;
  } else if (r.to.chapter === r.from.chapter) {
    inner = `${from}–${r.to.verse}${r.to.half ?? ""}`;
  } else {
    inner = `${from}–${r.to.chapter}:${r.to.verse}${r.to.half ?? ""}`;
  }
  return r.optional ? `(${inner})` : inner;
}
