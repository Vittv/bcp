export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export type Season =
  | "advent"
  | "christmas"
  | "epiphany"
  | "lent"
  | "holy-week"
  | "easter"
  | "pentecost"
  | "after-pentecost";

export type Color =
  | "blue"
  | "purple"
  | "white"
  | "gold"
  | "green"
  | "red"
  | "black";

export type DolWeek =
  | { kind: "advent"; week: 1 | 2 | 3 | 4 }
  | { kind: "christmas-following" }
  | { kind: "epiphany-following" }
  | { kind: "epiphany"; week: number }
  | { kind: "last-epiphany" }
  | { kind: "lent"; week: number }
  | { kind: "holy-week" }
  | { kind: "easter-week" }
  | { kind: "easter"; week: number }
  | { kind: "pentecost" }
  | { kind: "after-pentecost"; proper: number };

export type DolDay =
  | { kind: "weekday"; weekday: number }
  | { kind: "special"; name: string };

export interface DolSlot {
  year: 1 | 2;
  week: DolWeek;
  day: DolDay;
  evening?: DolDay;
  holyDay?: string;
}
