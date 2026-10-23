// english wikipedia articles for the lesser feasts, keyed by slug. only
// titles verified against the live encyclopedia belong here; a slug without
// an entry falls back to a wikipedia search built from the feast's name.
export type LesserFeastWikiLink = {
  /** english wikipedia article title. */
  title: string;
  /** label shown in the app, defaults to the article title. */
  label?: string;
};

export const LESSER_FEAST_WIKI: Record<string, LesserFeastWikiLink[]> = {
  "elizabeth-ann-seton-vowed-religious-and-educator": [
    { title: "Elizabeth Ann Seton" },
  ],
  "sarah-theodora-and-syncletica-of-egypt-desert-mothers-fourth-fifth-century":
    [{ title: "Desert Mothers" }],
  "harriet-bedell-deaconess-and-missionary": [{ title: "Harriet Bedell" }],
  "julia-chester-emery-lay-leader-and-missionary": [
    { title: "Julia Chester Emery" },
  ],
  "william-laud-archbishop-of-canterbury": [{ title: "William Laud" }],
  "aelred-of-rievaulx-monastic-and-theologian": [
    { title: "Aelred of Rievaulx" },
  ],
  "hilary-of-poitiers-bishop-367": [{ title: "Hilary of Poitiers" }],
  "richard-meux-benson-priest-and-charles-gore-bishop": [
    { title: "Richard Meux Benson" },
    { title: "Charles Gore" },
  ],
  "antony-of-egypt-monastic-356": [
    { title: "Anthony the Great", label: "Antony of Egypt" },
  ],
  "wulfstan-of-worcester-bishop": [
    { title: "Wulfstan (died 1095)", label: "Wulfstan of Worcester" },
  ],
  "fabian-bishop-and-martyr-250": [{ title: "Pope Fabian", label: "Fabian" }],
  "agnes-and-cecilia-of-rome-martyrs-304-and-230": [
    { title: "Agnes of Rome" },
    { title: "Cecilia of Rome" },
  ],
  "vincent-of-saragossa-deacon-and-martyr-304": [
    { title: "Vincent of Saragossa" },
  ],
  "phillips-brooks-bishop": [{ title: "Phillips Brooks" }],
  "florence-li-tim-oi-priest": [{ title: "Florence Li Tim-Oi" }],
  "timothy-and-titus-companions-of-saint-paul": [
    { title: "Saint Timothy", label: "Timothy" },
    { title: "Saint Titus", label: "Titus" },
  ],
  "john-chrysostom-bishop-and-theologian-407": [{ title: "John Chrysostom" }],
  "thomas-aquinas-friar-and-theologian": [{ title: "Thomas Aquinas" }],
  "liliuokalani-of-hawaii": [
    { title: "Liliʻuokalani", label: "Lili‘uokalani" },
  ],
  "marcella-of-rome-monastic-and-scholar-410": [{ title: "Marcella of Rome" }],
};

/** direct url for a verified english wikipedia article. */
export function wikipediaArticleUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(
    title.replace(/ /g, "_"),
  )}`;
}

/** search url for a feast without a verified article. */
export function wikipediaSearchUrl(name: string): string {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`;
}
