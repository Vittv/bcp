import type { ResolvedTheme, ThemeTokens } from "./tokens";

// a theme is a family: one full palette for light and one for dark. the id is
// what gets persisted and picked in Appearance; the light/dark pair lets a
// single family skin every component whether the app follows the system or a
// pinned mode. `mode` (light/dark/system) stays a separate axis that chooses
// which variant of the selected family applies.
export type ThemeId =
  | "canterbury"
  | "oxford"
  | "salisbury"
  | "york"
  | "chester"
  | "lindisfarne"
  | "durham"
  | "iona"
  | "washington"
  | "vague";

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  light: ThemeTokens;
  dark: ThemeTokens;
};

const CanterburyLight: ThemeTokens = {
  bg: "#e0dbd0",
  bgRaised: "#ece7dd",
  inputBg: "#ece7dd",
  surface: "#d5cfc4",
  // button plate: resting controls read as touchable without leaning on
  // their borders
  controlHover: "#d2cbbf",
  selectedBg: "#ece7dd",
  // keycap fill: recessed, darker than the surface
  keyBg: "rgba(44, 32, 32, 0.09)",
  todayBg: "rgba(122, 48, 64, 0.16)",

  border: "#cbc5bb",
  borderContent: "#a59d92",
  borderFaint: "rgba(44, 32, 32, 0.09)",

  text: "#2c2020",
  textSecondary: "#6b6159",
  onAccent: "#f6f1e8",

  accent: "#7a3040",

  // link-hint badge: wine chip with light text reads best on the light page
  hintBg: "#7a3040",
  hintText: "#f2ece4",

  scrollbar: "#a09589",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(20, 15, 15, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#3a68af",
    purple: "#7440ab",
    white: "#a3a3a3",
    gold: "#bb851b",
    green: "#52803a",
    red: "#a63d55",
    black: "#303035",
  },
  seasonRing: "rgba(44, 32, 32, 0.35)",
};

const CanterburyDark: ThemeTokens = {
  bg: "#1b191a",
  bgRaised: "#262425",
  inputBg: "#1f1d1f",
  surface: "#232122",
  controlHover: "#282628",
  selectedBg: "#262425",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(200, 95, 139, 0.30)",

  border: "#333034",
  borderContent: "#545053",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#d4d0d3",
  textSecondary: "#8d8985",
  onAccent: "#f6f1e8",

  accent: "#c85f8b",

  // link-hint badge: dark chip with pink text on the dark page
  hintBg: "#1b191a",
  hintText: "#c85f8b",

  scrollbar: "#5a5759",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(20, 15, 15, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#7e98e8",
    purple: "#6b4e97",
    white: "#cdcdcd",
    gold: "#f3be7c",
    green: "#7fa563",
    red: "#d8647e",
    black: "#3a3a3a",
  },
  seasonRing: "#00000055",
};

// Oxford: blue-grey surfaces with a saturated azure accent that stays legible
// on either page.
const OxfordLight: ThemeTokens = {
  bg: "#e7eaef",
  bgRaised: "#f1f3f7",
  inputBg: "#f1f3f7",
  surface: "#dde1e8",
  controlHover: "#d4d9e1",
  selectedBg: "#e3e7ee",
  keyBg: "rgba(30, 41, 59, 0.09)",
  todayBg: "rgba(47, 95, 208, 0.16)",

  border: "#ccd2dc",
  borderContent: "#9aa3b2",
  borderFaint: "rgba(30, 41, 59, 0.09)",

  text: "#1e293b",
  textSecondary: "#5b6678",
  onAccent: "#f8fafc",

  accent: "#2f5fd0",

  // link-hint badge: azure chip with near-white text
  hintBg: "#2f5fd0",
  hintText: "#eef2fb",

  scrollbar: "#98a2b3",

  scrim: "rgba(15, 23, 42, 0.45)",
  shadowColor: "#0f172a",
  shadowSoft: "rgba(15, 23, 42, 0.35)",
  shadowStrong: "rgba(15, 23, 42, 0.45)",
  panelShadow: "rgba(15, 23, 42, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#2f5fd0",
    purple: "#6d28d9",
    white: "#94a3b8",
    gold: "#b45309",
    green: "#15803d",
    red: "#be123c",
    black: "#334155",
  },
  seasonRing: "rgba(30, 41, 59, 0.35)",
};

const OxfordDark: ThemeTokens = {
  bg: "#12161c",
  bgRaised: "#1b212b",
  inputBg: "#161b22",
  surface: "#1a2029",
  controlHover: "#232b36",
  selectedBg: "#1b212b",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(110, 168, 254, 0.30)",

  border: "#2a323d",
  borderContent: "#4b5563",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#cbd5e1",
  textSecondary: "#8b95a5",
  onAccent: "#f8fafc",

  accent: "#6ea8fe",

  // link-hint badge: near-black chip with a bright azure glyph
  hintBg: "#12161c",
  hintText: "#6ea8fe",

  scrollbar: "#4b5563",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(9, 12, 17, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#7ea6ff",
    purple: "#a78bfa",
    white: "#cbd5e1",
    gold: "#f3be7c",
    green: "#86c07a",
    red: "#f1748c",
    black: "#475569",
  },
  seasonRing: "#00000055",
};

// Vague: soft, low-contrast greys and desaturated pastels with a periwinkle
// accent. the dark set is drawn directly from the palette (black page, graphite
// surfaces, iris accent); the light set is a derived companion that keeps the
// same muted hues on a cool off-white page.
const VagueLight: ThemeTokens = {
  bg: "#cdcdcd",
  bgRaised: "#d9d9d9",
  inputBg: "#d9d9d9",
  surface: "#c4c4c4",
  controlHover: "#b9b9b9",
  selectedBg: "#cfcfcf",
  keyBg: "rgba(20, 20, 21, 0.09)",
  todayBg: "rgba(79, 99, 196, 0.16)",

  border: "#b7b7b7",
  borderContent: "#7d7d87",
  borderFaint: "rgba(20, 20, 21, 0.09)",

  text: "#23232b",
  textSecondary: "#4f4f56",
  onAccent: "#f7f7fb",

  accent: "#4f63c4",

  hintBg: "#4f63c4",
  hintText: "#f2f3fa",

  scrollbar: "#8f8f99",

  scrim: "rgba(20, 20, 24, 0.45)",
  shadowColor: "#141415",
  shadowSoft: "rgba(15, 15, 20, 0.35)",
  shadowStrong: "rgba(15, 15, 20, 0.45)",
  panelShadow: "rgba(15, 15, 20, 0.18)",

  danger: "#c14a63",
  dangerText: "#ffffff",

  season: {
    blue: "#4257b0",
    purple: "#6d4f86",
    white: "#9a9aa8",
    gold: "#a8791f",
    green: "#5c7f43",
    red: "#b8425c",
    black: "#3a3a45",
  },
  seasonRing: "rgba(20, 20, 28, 0.35)",
};

const VagueDark: ThemeTokens = {
  bg: "#171719",
  bgRaised: "#1c1c24",
  inputBg: "#1c1c24",
  surface: "#1f1f28",
  controlHover: "#282833",
  selectedBg: "#1c1c24",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(126, 152, 232, 0.30)",

  border: "#2c2c37",
  borderContent: "#535369",
  borderFaint: "rgba(205, 205, 205, 0.07)",

  text: "#cdcdcd",
  textSecondary: "#878787",
  onAccent: "#141415",

  accent: "#7e98e8",

  hintBg: "#141415",
  hintText: "#7e98e8",

  scrollbar: "#606079",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(5, 5, 8, 0.18)",

  danger: "#d8647e",
  dangerText: "#141415",

  season: {
    blue: "#7e98e8",
    purple: "#bb9dbd",
    white: "#cdcdcd",
    gold: "#f3be7c",
    green: "#7fa563",
    red: "#d8647e",
    black: "#606079",
  },
  seasonRing: "#00000055",
};

// Salisbury: pale Chilmark limestone under a slate-blue sky. a quiet,
// cool-neutral family.
const SalisburyLight: ThemeTokens = {
  bg: "#eceae4",
  bgRaised: "#f4f3ee",
  inputBg: "#f4f3ee",
  surface: "#e0ddd4",
  controlHover: "#d7d4ca",
  selectedBg: "#e7e4dc",
  keyBg: "rgba(38, 40, 43, 0.09)",
  todayBg: "rgba(74, 107, 138, 0.16)",

  border: "#d3cfc5",
  borderContent: "#9a978d",
  borderFaint: "rgba(38, 40, 43, 0.09)",

  text: "#2b2f33",
  textSecondary: "#5f6360",
  onAccent: "#f6f7f8",

  accent: "#4a6b8a",

  hintBg: "#4a6b8a",
  hintText: "#eef2f6",

  scrollbar: "#a5a29a",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(20, 24, 28, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#3f6a94",
    purple: "#6a4d8f",
    white: "#9aa0a3",
    gold: "#9c7a2a",
    green: "#557452",
    red: "#a5434f",
    black: "#2c3136",
  },
  seasonRing: "rgba(38, 40, 43, 0.35)",
};

const SalisburyDark: ThemeTokens = {
  bg: "#181b1e",
  bgRaised: "#21252a",
  inputBg: "#1d2125",
  surface: "#22262b",
  controlHover: "#2a2f35",
  selectedBg: "#21252a",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(127, 163, 196, 0.30)",

  border: "#2f353c",
  borderContent: "#4f565e",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#d3d6d8",
  textSecondary: "#8b9096",
  onAccent: "#10161c",

  accent: "#7fa3c4",

  hintBg: "#181b1e",
  hintText: "#7fa3c4",

  scrollbar: "#555b62",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(9, 12, 15, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#7fa3c4",
    purple: "#a98bd8",
    white: "#cdd1d3",
    gold: "#e0b368",
    green: "#86b07c",
    red: "#e07d88",
    black: "#4a5058",
  },
  seasonRing: "#00000055",
};

// York: honey Magnesian limestone lit by the Minster's cobalt Rose Window,
// named for the northern province's seat.
const YorkLight: ThemeTokens = {
  bg: "#efe6d5",
  bgRaised: "#f7f0e2",
  inputBg: "#f7f0e2",
  surface: "#e4d8c2",
  controlHover: "#dbcdb3",
  selectedBg: "#ece2d0",
  keyBg: "rgba(51, 41, 28, 0.09)",
  todayBg: "rgba(47, 74, 143, 0.16)",

  border: "#d8cbb4",
  borderContent: "#a2937a",
  borderFaint: "rgba(51, 41, 28, 0.09)",

  text: "#33291c",
  textSecondary: "#6b5f4c",
  onAccent: "#f5f7fc",

  accent: "#2f4a8f",

  hintBg: "#2f4a8f",
  hintText: "#eef2fb",

  scrollbar: "#b0a184",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(35, 26, 12, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#2f4a8f",
    purple: "#6d3f8f",
    white: "#a99b82",
    gold: "#a5761a",
    green: "#5a7233",
    red: "#a63b3b",
    black: "#3a3123",
  },
  seasonRing: "rgba(51, 41, 28, 0.35)",
};

const YorkDark: ThemeTokens = {
  bg: "#1c1913",
  bgRaised: "#262219",
  inputBg: "#221e16",
  surface: "#272219",
  controlHover: "#322b1f",
  selectedBg: "#262219",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(111, 143, 216, 0.30)",

  border: "#3a3322",
  borderContent: "#5c5240",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#ddd3c2",
  textSecondary: "#948a76",
  onAccent: "#10172e",

  accent: "#6f8fd8",

  hintBg: "#1c1913",
  hintText: "#6f8fd8",

  scrollbar: "#5a5140",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(15, 12, 6, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#6f8fd8",
    purple: "#b48fd8",
    white: "#d8cfbd",
    gold: "#e8b967",
    green: "#9bb56f",
    red: "#e08a7a",
    black: "#4f4738",
  },
  seasonRing: "#00000055",
};

// Chester: the city's Triassic New Red Sandstone, mottled red and white, whose
// iron-red grain gives the cathedral its famous warm, pinkish glow. the page is
// the pale weathered stone; the accent is the stone's own deep iron-red.
const ChesterLight: ThemeTokens = {
  bg: "#e9ded4",
  bgRaised: "#f4ece3",
  inputBg: "#f4ece3",
  surface: "#ddcfc2",
  controlHover: "#d3c4b5",
  selectedBg: "#e4d8cc",
  keyBg: "rgba(58, 36, 26, 0.09)",
  todayBg: "rgba(162, 71, 42, 0.16)",

  border: "#d2c3b4",
  borderContent: "#a28f7c",
  borderFaint: "rgba(58, 36, 26, 0.09)",

  text: "#3a2a22",
  textSecondary: "#6f5b4a",
  onAccent: "#f7efe6",

  accent: "#a4472a",

  // link-hint badge: the sandstone red with light stone text
  hintBg: "#a4472a",
  hintText: "#f6ece1",

  scrollbar: "#a8927e",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(38, 22, 12, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#3f6096",
    purple: "#704a8f",
    white: "#a99a8a",
    gold: "#a8791f",
    green: "#527a4a",
    red: "#a83a2c",
    black: "#35271f",
  },
  seasonRing: "rgba(58, 36, 26, 0.35)",
};

const ChesterDark: ThemeTokens = {
  bg: "#1b1817",
  bgRaised: "#262322",
  inputBg: "#201d1c",
  surface: "#262322",
  controlHover: "#302d2b",
  selectedBg: "#262322",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(198, 156, 136, 0.26)",

  border: "#37332f",
  borderContent: "#59524c",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#d6d0ca",
  textSecondary: "#98918b",
  onAccent: "#1b110d",

  // muted clay rather than the raw iron-red: the deep ground needs a gentle
  // accent, not the stone at full strength, and the page stays near-neutral
  // so the warmth lives in the accent instead of tinting every surface brown
  accent: "#c69c88",

  // link-hint badge: near-black stone with the softened sandstone as the glyph
  hintBg: "#1b1817",
  hintText: "#c69c88",

  scrollbar: "#59524c",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(12, 6, 3, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#7ea6d8",
    purple: "#b48fd8",
    white: "#d6d0ca",
    gold: "#d8b57f",
    green: "#86b07c",
    red: "#cf9d8c",
    black: "#4a3c33",
  },
  seasonRing: "#00000055",
};

// Lindisfarne: the North Sea and the Lindisfarne Gospels' gold leaf. a cool,
// luminous family built around a sea-teal accent.
const LindisfarneLight: ThemeTokens = {
  bg: "#e6ecec",
  bgRaised: "#f1f5f5",
  inputBg: "#f1f5f5",
  surface: "#d8e3e3",
  controlHover: "#cddbdb",
  selectedBg: "#dfe8e8",
  keyBg: "rgba(34, 49, 58, 0.09)",
  todayBg: "rgba(31, 122, 140, 0.16)",

  border: "#c9d6d6",
  borderContent: "#8fa3a6",
  borderFaint: "rgba(34, 49, 58, 0.09)",

  text: "#22313a",
  textSecondary: "#566a70",
  onAccent: "#f2fbfb",

  accent: "#1f7a8c",

  hintBg: "#1f7a8c",
  hintText: "#eafafc",

  scrollbar: "#93a7a9",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(12, 26, 30, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#2f6ea8",
    purple: "#6a4d8f",
    white: "#93a6a4",
    gold: "#a8811f",
    green: "#4f7f5a",
    red: "#a6424f",
    black: "#26333a",
  },
  seasonRing: "rgba(34, 49, 58, 0.35)",
};

const LindisfarneDark: ThemeTokens = {
  bg: "#0f1719",
  bgRaised: "#172426",
  inputBg: "#142022",
  surface: "#172426",
  controlHover: "#1f3033",
  selectedBg: "#172426",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(86, 198, 208, 0.30)",

  border: "#24363a",
  borderContent: "#3f5a5f",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#ccd8d9",
  textSecondary: "#7f9698",
  onAccent: "#08191c",

  accent: "#56c6d0",

  hintBg: "#0f1719",
  hintText: "#56c6d0",

  scrollbar: "#3f5a5f",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(4, 14, 16, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#6cb8d8",
    purple: "#a98bd8",
    white: "#cdd8d6",
    gold: "#e0c168",
    green: "#86c79a",
    red: "#e07d88",
    black: "#3f5a5f",
  },
  seasonRing: "#00000055",
};

// Durham: weathered northern stone above the Wear, with the Prince-Bishops'
// amethyst. a purple-leaning family that sits easily with Advent and Lent.
const DurhamLight: ThemeTokens = {
  bg: "#e4e1e6",
  bgRaised: "#f0eef3",
  inputBg: "#f0eef3",
  surface: "#d7d3db",
  controlHover: "#ccc7d2",
  selectedBg: "#ded9e4",
  keyBg: "rgba(42, 36, 48, 0.09)",
  todayBg: "rgba(107, 63, 160, 0.16)",

  border: "#c8c2cf",
  borderContent: "#948ca2",
  borderFaint: "rgba(42, 36, 48, 0.09)",

  text: "#2a2430",
  textSecondary: "#605868",
  onAccent: "#f7f4fb",

  accent: "#6b3fa0",

  hintBg: "#6b3fa0",
  hintText: "#f0e9f8",

  scrollbar: "#a29aab",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(20, 14, 28, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#3f5ca8",
    purple: "#6b3fa0",
    white: "#9a94a4",
    gold: "#9c7a2a",
    green: "#4f7a52",
    red: "#a63b4f",
    black: "#2c2632",
  },
  seasonRing: "rgba(42, 36, 48, 0.35)",
};

const DurhamDark: ThemeTokens = {
  bg: "#17141c",
  bgRaised: "#201b28",
  inputBg: "#1c1823",
  surface: "#201b28",
  controlHover: "#292232",
  selectedBg: "#201b28",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(169, 139, 216, 0.30)",

  border: "#2e2738",
  borderContent: "#4d4459",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#d6d0dc",
  textSecondary: "#8b8394",
  onAccent: "#130f1a",

  accent: "#a98bd8",

  hintBg: "#17141c",
  hintText: "#a98bd8",

  scrollbar: "#4d4459",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(10, 7, 15, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#8ba0e0",
    purple: "#a98bd8",
    white: "#d8d2de",
    gold: "#e0b368",
    green: "#86b07c",
    red: "#e07d88",
    black: "#4a4256",
  },
  seasonRing: "#00000055",
};

// Iona: the machair's green and the Sound's slate. a restful Celtic family
// built around a sea-green accent.
const IonaLight: ThemeTokens = {
  bg: "#e9ece6",
  bgRaised: "#f3f5f0",
  inputBg: "#f3f5f0",
  surface: "#dbe0d4",
  controlHover: "#d0d7c7",
  selectedBg: "#e2e6dc",
  keyBg: "rgba(38, 48, 42, 0.09)",
  todayBg: "rgba(63, 125, 106, 0.16)",

  border: "#cbd3c4",
  borderContent: "#92a08d",
  borderFaint: "rgba(38, 48, 42, 0.09)",

  text: "#26302a",
  textSecondary: "#5a685f",
  onAccent: "#f2faf6",

  accent: "#3f7d6a",

  hintBg: "#3f7d6a",
  hintText: "#eaf6f0",

  scrollbar: "#9aa894",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(14, 26, 20, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#3f6ea0",
    purple: "#6a4d8f",
    white: "#97a199",
    gold: "#a8811f",
    green: "#4f7f52",
    red: "#a6424f",
    black: "#2a332d",
  },
  seasonRing: "rgba(38, 48, 42, 0.35)",
};

const IonaDark: ThemeTokens = {
  bg: "#121815",
  bgRaised: "#1b2320",
  inputBg: "#171f1c",
  surface: "#1b2320",
  controlHover: "#232d29",
  selectedBg: "#1b2320",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(111, 191, 159, 0.30)",

  border: "#28332e",
  borderContent: "#43544c",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#cfdad3",
  textSecondary: "#82958b",
  onAccent: "#0b1712",

  accent: "#6fbf9f",

  hintBg: "#121815",
  hintText: "#6fbf9f",

  scrollbar: "#43544c",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(5, 13, 9, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#7fa3d0",
    purple: "#a98bd8",
    white: "#cfd8d1",
    gold: "#e0c168",
    green: "#86c79a",
    red: "#e07d88",
    black: "#43544c",
  },
  seasonRing: "#00000055",
};

// Washington: the National Cathedral's grey gneiss and the crimson of its
// rose window. the American Episcopal flagship.
const WashingtonLight: ThemeTokens = {
  bg: "#e8e8ea",
  bgRaised: "#f3f3f5",
  inputBg: "#f3f3f5",
  surface: "#dbdbdf",
  controlHover: "#d0d0d5",
  selectedBg: "#e1e1e5",
  keyBg: "rgba(35, 38, 43, 0.09)",
  todayBg: "rgba(143, 45, 60, 0.16)",

  border: "#cdcdd2",
  borderContent: "#98989f",
  borderFaint: "rgba(35, 38, 43, 0.09)",

  text: "#23262b",
  textSecondary: "#5d6067",
  onAccent: "#fbf3f4",

  accent: "#8f2d3c",

  hintBg: "#8f2d3c",
  hintText: "#fbeef0",

  scrollbar: "#a2a2a8",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(24, 16, 18, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#3f5ca8",
    purple: "#6a4d8f",
    white: "#9a9ea4",
    gold: "#a8791f",
    green: "#4f7a52",
    red: "#8f2d3c",
    black: "#2c3036",
  },
  seasonRing: "rgba(35, 38, 43, 0.35)",
};

const WashingtonDark: ThemeTokens = {
  bg: "#141517",
  bgRaised: "#1e2023",
  inputBg: "#1a1c1f",
  surface: "#1e2023",
  controlHover: "#262a2e",
  selectedBg: "#1e2023",
  keyBg: "rgba(0, 0, 0, 0.32)",
  todayBg: "rgba(215, 107, 120, 0.30)",

  border: "#2b2f34",
  borderContent: "#4b5057",
  borderFaint: "rgba(255, 255, 255, 0.07)",

  text: "#d2d3d6",
  textSecondary: "#8a8d92",
  onAccent: "#16090c",

  accent: "#d76b78",

  hintBg: "#141517",
  hintText: "#d76b78",

  scrollbar: "#4b5057",

  scrim: "rgba(0, 0, 0, 0.45)",
  shadowColor: "#000000",
  shadowSoft: "rgba(0, 0, 0, 0.35)",
  shadowStrong: "rgba(0, 0, 0, 0.45)",
  panelShadow: "rgba(9, 7, 8, 0.18)",

  danger: "#e81123",
  dangerText: "#ffffff",

  season: {
    blue: "#8ba0e0",
    purple: "#a98bd8",
    white: "#d3d5d8",
    gold: "#e0b368",
    green: "#86b07c",
    red: "#d76b78",
    black: "#474c53",
  },
  seasonRing: "#00000055",
};

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  canterbury: {
    id: "canterbury",
    label: "Canterbury",
    light: CanterburyLight,
    dark: CanterburyDark,
  },
  oxford: {
    id: "oxford",
    label: "Oxford",
    light: OxfordLight,
    dark: OxfordDark,
  },
  vague: {
    id: "vague",
    label: "Vague",
    light: VagueLight,
    dark: VagueDark,
  },
  salisbury: {
    id: "salisbury",
    label: "Salisbury",
    light: SalisburyLight,
    dark: SalisburyDark,
  },
  york: {
    id: "york",
    label: "York",
    light: YorkLight,
    dark: YorkDark,
  },
  chester: {
    id: "chester",
    label: "Chester",
    light: ChesterLight,
    dark: ChesterDark,
  },
  lindisfarne: {
    id: "lindisfarne",
    label: "Lindisfarne",
    light: LindisfarneLight,
    dark: LindisfarneDark,
  },
  durham: {
    id: "durham",
    label: "Durham",
    light: DurhamLight,
    dark: DurhamDark,
  },
  iona: {
    id: "iona",
    label: "Iona",
    light: IonaLight,
    dark: IonaDark,
  },
  washington: {
    id: "washington",
    label: "Washington",
    light: WashingtonLight,
    dark: WashingtonDark,
  },
};

// the order the appearance picker lists the families in.
export const THEME_LIST: ThemeDefinition[] = [
  THEMES.canterbury,
  THEMES.oxford,
  THEMES.salisbury,
  THEMES.york,
  THEMES.chester,
  THEMES.lindisfarne,
  THEMES.durham,
  THEMES.iona,
  THEMES.washington,
  THEMES.vague,
];

export const DEFAULT_THEME: ThemeId = "canterbury";

// the palette for a family at a resolved mode. the indirection keeps callers
// (the context, the picker previews) off the token shape, so a family can add
// variants without touching them.
export function themeTokens(theme: ThemeId, mode: ResolvedTheme): ThemeTokens {
  return mode === "dark" ? THEMES[theme].dark : THEMES[theme].light;
}
