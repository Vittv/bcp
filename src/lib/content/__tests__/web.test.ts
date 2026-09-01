import { describe, expect, it } from "bun:test";
import { getKjvBookMeta, loadKjvBook } from "../kjv";
import { kjvBookSchema } from "../schemas";
import {
  getWebBookMeta,
  getWebBooksByTestament,
  loadWebBook,
  WEB_BOOKS,
} from "../web";

describe("WEB combined book list", () => {
  it("has 81 books total (66 canonical + 15 DC)", () => {
    expect(WEB_BOOKS.length).toBe(81);
  });

  it("has 39 OT books (inherited from KJV)", () => {
    const ot = getWebBooksByTestament("OT");
    expect(ot.length).toBe(39);
  });

  it("has 27 NT books (inherited from KJV)", () => {
    const nt = getWebBooksByTestament("NT");
    expect(nt.length).toBe(27);
  });

  it("has 15 deuterocanonical books", () => {
    const dc = getWebBooksByTestament("DC");
    expect(dc.length).toBe(15);
    expect(dc.map((b) => b.abbrev)).toContain("Sir");
    expect(dc.map((b) => b.abbrev)).toContain("Wis");
    expect(dc.map((b) => b.abbrev)).toContain("1 Macc");
    expect(dc.map((b) => b.abbrev)).toContain("2 Esd");
  });

  it("Genesis metadata matches KJV metadata", () => {
    const web = getWebBookMeta("Gen");
    const kjv = getKjvBookMeta("Gen");
    expect(web).toBeDefined();
    expect(kjv).toBeDefined();
    expect(web?.book).toBe(kjv?.book);
    expect(web?.abbrev).toBe(kjv?.abbrev);
    expect(web?.testament).toBe("OT");
    expect(web?.chapters).toBe(50);
  });

  it("recognizes deuterocanonical DOL reference names", () => {
    expect(getWebBookMeta("Wis")).toBeDefined();
    expect(getWebBookMeta("Wisdom")).toBeDefined();
    expect(getWebBookMeta("Wisdom of Solomon")).toBeDefined();
    expect(getWebBookMeta("Sir")).toBeDefined();
    expect(getWebBookMeta("Sirach")).toBeDefined();
    expect(getWebBookMeta("1 Macc")).toBeDefined();
    expect(getWebBookMeta("1 Maccabees")).toBeDefined();
    expect(getWebBookMeta("Jdt")).toBeDefined();
    expect(getWebBookMeta("Judith")).toBeDefined();
    expect(getWebBookMeta("2 Esd")).toBeDefined();
    expect(getWebBookMeta("2 Esdras")).toBeDefined();
    expect(getWebBookMeta("Bar")).toBeDefined();
    expect(getWebBookMeta("Baruch")).toBeDefined();
  });
});

describe("WEB book loading", () => {
  it("loads Genesis from the vendored WEB data", async () => {
    const book = await loadWebBook("Gen");
    expect(book).not.toBeNull();
    expect(book?.book).toBe("Genesis");
    expect(book?.testament).toBe("OT");
    expect(book?.chapters).toBe(50);
    expect(book?.verses["1"]).toBeDefined();
  });

  it("loads Sirach as a deuterocanonical book", async () => {
    const book = await loadWebBook("Sir");
    expect(book).not.toBeNull();
    expect(book?.book).toBe("Sirach");
    expect(book?.abbrev).toBe("Sir");
    expect(book?.testament).toBe("DC");
    expect(book?.chapters).toBe(51);
    expect(book?.verses["1"]).toBeDefined();
    expect(book?.verses["1"]["1"]).toContain("wisdom");
  });

  it("loads Wisdom of Solomon", async () => {
    const book = await loadWebBook("Wis");
    expect(book).not.toBeNull();
    expect(book?.book).toBe("Wisdom of Solomon");
    expect(book?.testament).toBe("DC");
    expect(book?.chapters).toBe(19);
  });

  it("loads 2 Esdras", async () => {
    const book = await loadWebBook("2 Esd");
    expect(book).not.toBeNull();
    expect(book?.book).toBe("2 Esdras");
    expect(book?.testament).toBe("DC");
    expect(book?.chapters).toBe(16);
  });

  it("returns null for an unrecognized name", async () => {
    expect(await loadWebBook("NotABook")).toBeNull();
  });

  it("validates schema for every WEB canonical book", async () => {
    for (const meta of getWebBooksByTestament("OT").concat(
      getWebBooksByTestament("NT"),
    )) {
      const book = await loadWebBook(meta.abbrev);
      expect(book).not.toBeNull();
      const result = kjvBookSchema.safeParse(book);
      expect(result.success).toBe(true);
    }
  });

  it("validates schema for every WEB DC book", async () => {
    for (const meta of getWebBooksByTestament("DC")) {
      const book = await loadWebBook(meta.abbrev);
      expect(book).not.toBeNull();
      const result = kjvBookSchema.safeParse(book);
      expect(result.success).toBe(true);
    }
  });
});

describe("WEB books match KJV chapter counts", () => {
  it("Genesis chapters match", async () => {
    const kjv = await loadKjvBook("Gen");
    const web = await loadWebBook("Gen");
    expect(web?.chapters).toBe(kjv?.chapters);
  });

  it("Revelation chapters match", async () => {
    const kjv = await loadKjvBook("Rev");
    const web = await loadWebBook("Rev");
    expect(web?.chapters).toBe(kjv?.chapters);
  });
});
