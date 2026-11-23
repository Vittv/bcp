import type { CalendarDate } from "../calendar/types";
import { litanySchema } from "./schemas";
import type { LitanyLine } from "./types";
import litanyData from "./vendor/bcp/litany.min.json";

// the shared Litany renderer serves all three editions; each composer maps its
// own vendored lines onto this shape so the view stays edition-agnostic
export type LitanyNode =
  | { kind: "rubric"; text: string; choiceAnchorFor?: string }
  | { kind: "heading"; text: string }
  | {
      kind: "text";
      text: string;
      speaker?: "minister" | "officiant" | "people" | "all";
      lordsPrayer?: boolean;
      lordsPrayerFirst?: boolean;
      lordsPrayerLast?: boolean;
      choiceGroup?: string;
      choiceId?: string;
      choiceLabel?: string;
    };

export type LitanyDoc = {
  officeName: string;
  date: CalendarDate;
  nodes: LitanyNode[];
};

const LITANY: { lines: LitanyLine[] } = litanySchema.parse(litanyData);

export function get1979LitanyLines(): LitanyLine[] {
  return LITANY.lines;
}

// the book prints the Lord's Prayer as one paragraph; one petition per line
// matches the way the daily offices render it
function lordsPrayerNodes(text: string): LitanyNode[] {
  const lines = text
    .split(
      /(?<=\.)\s+(?=Give us this day)|(?<=[.;])\s+(?=And lead us not)|(?<=[.;])\s+(?=For thine is the kingdom)/,
    )
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line, i) => ({
    kind: "text",
    text: line,
    lordsPrayer: true,
    lordsPrayerFirst: i === 0,
    lordsPrayerLast: i === lines.length - 1,
  }));
}

export type Bcp1979LitanyDoc = LitanyDoc & {
  edition: "1979";
  officeName: "The Litany";
};

/** compose the 1979 Great Litany as a standalone office of fixed text. */
export function composeBcp1979Litany(date: CalendarDate): Bcp1979LitanyDoc {
  return {
    edition: "1979",
    officeName: "The Litany",
    date,
    nodes: LITANY.lines.flatMap((line): LitanyNode[] => {
      if (
        line.kind === "text" &&
        line.text.startsWith("Our Father, who art in heaven")
      ) {
        return lordsPrayerNodes(line.text);
      }
      return [{ ...line }];
    }),
  };
}
