import type { OfficeId } from "../content/types";
import { DAILY_OFFICES, type OfficeRite } from "./types";

export type DailyOfficeTab = "morning" | "noonday" | "evening" | "compline";

// morning and evening carry both rites; noonday and compline have one form.
export function dailyOfficeId(tab: DailyOfficeTab, rite: OfficeRite): OfficeId {
  switch (tab) {
    case "morning":
      return DAILY_OFFICES.morning[rite];
    case "evening":
      return DAILY_OFFICES.evening[rite];
    case "noonday":
      return "noonday";
    case "compline":
      return "compline";
  }
}
