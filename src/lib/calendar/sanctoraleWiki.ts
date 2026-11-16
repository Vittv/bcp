// english wikipedia articles for the holy days (sanctorale), keyed by slug.
// only titles verified against the live encyclopedia belong here; a slug
// without an entry falls back to a wikipedia search built from the feast's
// title.
export type SanctoraleWikiLink = {
  /** english wikipedia article title. */
  title: string;
  /** label shown in the app, defaults to the article title. */
  label?: string;
};

export const SANCTORALE_WIKI: Record<string, SanctoraleWikiLink[]> = {
  "confession-of-st-peter": [{ title: "Confession of Peter" }],
  "conversion-of-st-paul": [{ title: "Conversion of Paul the Apostle" }],
  "eve-of-presentation": [
    {
      title: "Presentation of Jesus at the Temple",
      label: "Presentation of Jesus",
    },
  ],
  presentation: [
    {
      title: "Presentation of Jesus at the Temple",
      label: "Presentation of Jesus",
    },
  ],
  "st-matthias": [{ title: "Saint Matthias", label: "Matthias the Apostle" }],
  "st-joseph": [{ title: "Saint Joseph" }],
  "eve-of-annunciation": [{ title: "Annunciation" }],
  annunciation: [{ title: "Annunciation" }],
  "st-mark": [{ title: "Mark the Evangelist" }],
  "philip-and-james": [
    { title: "Philip the Apostle" },
    { title: "James, son of Alphaeus" },
  ],
  "eve-of-visitation": [
    { title: "Visitation (Christianity)", label: "Visitation" },
  ],
  visitation: [{ title: "Visitation (Christianity)", label: "Visitation" }],
  "st-barnabas": [{ title: "Barnabas" }],
  "eve-of-st-john-the-baptist": [{ title: "Nativity of John the Baptist" }],
  "nativity-of-st-john-the-baptist": [
    { title: "Nativity of John the Baptist" },
  ],
  "peter-and-paul": [{ title: "Saint Peter" }, { title: "Paul the Apostle" }],
  "st-mary-magdalene": [{ title: "Mary Magdalene" }],
  "st-james": [{ title: "James the Great" }],
  "eve-of-transfiguration": [{ title: "Transfiguration of Jesus" }],
  transfiguration: [{ title: "Transfiguration of Jesus" }],
  "st-mary-the-virgin": [
    { title: "Mary, mother of Jesus", label: "Mary, Mother of Jesus" },
  ],
  "st-bartholomew": [{ title: "Bartholomew the Apostle" }],
  "eve-of-holy-cross": [
    { title: "Feast of the Cross", label: "Holy Cross Day" },
  ],
  "holy-cross": [{ title: "Feast of the Cross", label: "Holy Cross Day" }],
  "st-matthew": [{ title: "Matthew the Apostle" }],
  "st-michael-and-all-angels": [{ title: "Michaelmas" }],
  "st-luke": [{ title: "Luke the Evangelist" }],
  "st-james-of-jerusalem": [
    { title: "James, brother of Jesus", label: "James of Jerusalem" },
  ],
  "simon-and-jude": [
    { title: "Simon the Zealot" },
    { title: "Jude the Apostle" },
  ],
  "eve-of-all-saints": [{ title: "All Saints' Day" }],
  "all-saints": [{ title: "All Saints' Day" }],
  "st-andrew": [{ title: "Andrew the Apostle" }],
  "st-thomas": [{ title: "Thomas the Apostle" }],
  "st-stephen": [{ title: "Saint Stephen" }],
  "st-john": [{ title: "John the Apostle" }],
  "holy-innocents": [
    { title: "Massacre of the Innocents", label: "Holy Innocents" },
  ],
};
