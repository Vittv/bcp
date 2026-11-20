import type { TabId } from "./shellUtils";

export function officeForHour(hour: number): TabId {
  if (hour < 12) return "morning";
  if (hour < 17) return "noonday";
  if (hour < 21) return "evening";
  return "compline";
}

export function officeForHour1662(hour: number): TabId {
  if (hour < 12) return "morning";
  return "evening";
}

// the full 1962 day: Morning and Evening Prayer with Prayers at Mid-day and
// Compline between them. devotions mode exposes only the two principal forms,
// so it keeps the older two-office mapping.
export function officeForHour1962(hour: number, devotions = false): TabId {
  if (hour < 12) return "morning";
  if (devotions) return "evening";
  if (hour < 17) return "noonday";
  if (hour < 21) return "evening";
  return "compline";
}
