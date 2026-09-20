// a reusable token matcher for the settings rail search and, later, the
// global cmd+K palette. entries carry a title plus extra keywords so a
// section like office matches both its name and the options it contains
// (rubrics, speakers, devotions).

export type SearchEntry = {
  title: string;
  keywords?: string[];
};

// keep an entry when every whitespace-separated token of the query appears
// in its searchable text; an empty query keeps everything so callers can
// run this unconditionally
export function filterSearch<T extends SearchEntry>(
  query: string,
  entries: readonly T[],
): T[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [...entries];
  return entries.filter((entry) => {
    const haystack = [entry.title, ...(entry.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}
