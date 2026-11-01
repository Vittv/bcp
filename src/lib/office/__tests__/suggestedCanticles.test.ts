import { describe, expect, test } from "bun:test";
import { suggestedCanticles } from "../suggestedCanticles";

const base = {
  office: "morning" as const,
  rite: "Two" as const,
  weekday: 0,
  season: "after-pentecost" as const,
  isFeast: false,
};

describe("the p. 144 table", () => {
  test("ordinary weekday rows", () => {
    // Thursday morning: 8 then 6/20
    expect(
      suggestedCanticles({
        ...base,
        weekday: 4,
        rite: "One",
      }),
    ).toEqual([8, 6]);
    expect(
      suggestedCanticles({
        ...base,
        weekday: 4,
        rite: "Two",
      }),
    ).toEqual([8, 20]);
    // Friday evening: 2/13 then 5/17
    expect(
      suggestedCanticles({
        ...base,
        office: "evening",
        weekday: 5,
        rite: "One",
      }),
    ).toEqual([2, 5]);
    expect(
      suggestedCanticles({
        ...base,
        office: "evening",
        weekday: 5,
        rite: "Two",
      }),
    ).toEqual([13, 17]);
  });

  test("Sunday rows", () => {
    expect(suggestedCanticles({ ...base, rite: "One" })).toEqual([4, 7]);
    expect(suggestedCanticles({ ...base, rite: "Two" })).toEqual([16, 21]);
    expect(
      suggestedCanticles({ ...base, office: "evening", rite: "One" }),
    ).toEqual([3, 5]);
    expect(
      suggestedCanticles({ ...base, office: "evening", rite: "Two" }),
    ).toEqual([15, 17]);
  });

  test("season overrides", () => {
    // Advent Sunday: 11 then 4/16
    expect(
      suggestedCanticles({ ...base, season: "advent", rite: "One" }),
    ).toEqual([11, 4]);
    expect(
      suggestedCanticles({ ...base, season: "advent", rite: "Two" }),
    ).toEqual([11, 16]);
    // Lent Sunday: 14 then 4/16
    expect(
      suggestedCanticles({ ...base, season: "lent", rite: "One" }),
    ).toEqual([14, 4]);
    expect(
      suggestedCanticles({ ...base, season: "lent", rite: "Two" }),
    ).toEqual([14, 16]);
    // Easter Sunday: 8 then 7/21
    expect(
      suggestedCanticles({ ...base, season: "easter", rite: "One" }),
    ).toEqual([8, 7]);
    expect(
      suggestedCanticles({ ...base, season: "easter", rite: "Two" }),
    ).toEqual([8, 21]);
  });

  test("a feast takes the Sunday row on any weekday", () => {
    expect(
      suggestedCanticles({
        ...base,
        weekday: 5,
        isFeast: true,
        rite: "One",
      }),
    ).toEqual([4, 7]);
    expect(
      suggestedCanticles({
        ...base,
        office: "evening",
        weekday: 5,
        isFeast: true,
        rite: "Two",
      }),
    ).toEqual([15, 17]);
  });

  test("penitential weekdays", () => {
    // Lent Monday evening: 14 then 5/17
    expect(
      suggestedCanticles({
        ...base,
        office: "evening",
        weekday: 1,
        season: "lent",
        rite: "One",
      }),
    ).toEqual([14, 5]);
    // Holy Week Wednesday morning: 14 then 4/16
    expect(
      suggestedCanticles({
        ...base,
        weekday: 3,
        season: "holy-week",
        rite: "Two",
      }),
    ).toEqual([14, 16]);
  });
});
