import { describe, expect, it } from "bun:test";
import { allFeasts } from "../../calendar/feastsByTradition";
import { propersForFeast } from "../feastPropers";

describe("1962 Eucharistic propers", () => {
  it("supplies both readings for a saint from the proper headings", () => {
    const andrew = allFeasts("acc").find(
      (f) => f.canonical === "st-andrew" && f.month === 11 && f.day === 30,
    );
    if (!andrew) throw new Error("missing Saint Andrew");
    expect(propersForFeast(andrew, "acc").readings).toEqual([
      "Romans 10. 8.",
      "St Matthew 4. 18.",
    ]);
  });

  it("handles a proper whose first reading is titled Lesson", () => {
    const saints = allFeasts("acc").find((f) => f.canonical === "all-saints");
    if (!saints) throw new Error("missing All Saints");
    expect(propersForFeast(saints, "acc").readings).toEqual([
      "Revelation 7. 9.",
      "St Matthew 5. 1.",
    ]);
  });
});
