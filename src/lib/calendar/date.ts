import type { CalendarDate } from "./types";

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

// Howard Hinnant's days_from_civil. Days since 1970-01-01 (1970-01-01 = 0).
export function daysFromCivil(
  year: number,
  month: number,
  day: number,
): number {
  const y = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy =
    Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function civilFromDays(days: number): CalendarDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe -
      Math.floor(doe / 1460) +
      Math.floor(doe / 36524) -
      Math.floor(doe / 146096)) /
      365,
  );
  const year = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: year + (month <= 2 ? 1 : 0), month, day };
}

export function toDays(date: CalendarDate): number {
  return daysFromCivil(date.year, date.month, date.day);
}

export function fromDays(days: number): CalendarDate {
  return civilFromDays(days);
}

export function addDays(date: CalendarDate, n: number): CalendarDate {
  return civilFromDays(toDays(date) + n);
}

export function diffDays(a: CalendarDate, b: CalendarDate): number {
  return toDays(a) - toDays(b);
}

// Sunday = 0 ... Saturday = 6. 1970-01-01 was a Thursday (4).
export function weekday(date: CalendarDate): number {
  return (((toDays(date) + 4) % 7) + 7) % 7;
}

export function sundayOnOrBefore(date: CalendarDate): CalendarDate {
  return addDays(date, -weekday(date));
}

export function sundayOnOrAfter(date: CalendarDate): CalendarDate {
  return addDays(date, (7 - weekday(date)) % 7);
}

// the Sunday of the Monday-to-Sunday week containing date.
export function sundayOfWeek(date: CalendarDate): CalendarDate {
  return addDays(date, (7 - weekday(date)) % 7);
}

export function fromDate(date: Date): CalendarDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function toDate(date: CalendarDate): Date {
  return new Date(date.year, date.month - 1, date.day);
}
