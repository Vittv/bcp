import { describe, expect, test } from "bun:test";
import {
  type ChangelogBlock,
  parseChangelogMarkdown,
  parseInline,
} from "../changelogMd";

describe("parseInline", () => {
  test("plain text", () => {
    expect(parseInline("hello")).toEqual([{ t: "text", value: "hello" }]);
  });

  test("bold", () => {
    expect(parseInline("a **b** c")).toEqual([
      { t: "text", value: "a " },
      { t: "bold", children: [{ t: "text", value: "b" }] },
      { t: "text", value: " c" },
    ]);
  });

  test("code", () => {
    expect(parseInline("run `bun check` now")).toEqual([
      { t: "text", value: "run " },
      { t: "code", value: "bun check" },
      { t: "text", value: " now" },
    ]);
  });

  test("link", () => {
    expect(parseInline("see [the source](https://example.com) here")).toEqual([
      { t: "text", value: "see " },
      {
        t: "link",
        href: "https://example.com",
        children: [{ t: "text", value: "the source" }],
      },
      { t: "text", value: " here" },
    ]);
  });

  test("bold label inside a link", () => {
    expect(parseInline("[**bold**](https://x.dev)")).toEqual([
      {
        t: "link",
        href: "https://x.dev",
        children: [{ t: "bold", children: [{ t: "text", value: "bold" }] }],
      },
    ]);
  });
});

describe("parseChangelogMarkdown", () => {
  const releaseNote = `# bcp v0.3.3

## Section one

A paragraph explaining the first change.

## Section two

- first bullet
- second bullet

**Full Changelog**: <https://github.com/Vittv/bcp/compare/v0.3.2...v0.3.3>`;

  test("typical release body", () => {
    expect(parseChangelogMarkdown(releaseNote)).toEqual<ChangelogBlock[]>([
      { t: "title", text: "bcp v0.3.3" },
      { t: "heading", level: 2, text: "Section one" },
      { t: "paragraph", text: "A paragraph explaining the first change." },
      { t: "heading", level: 2, text: "Section two" },
      { t: "bullets", items: ["first bullet", "second bullet"] },
      {
        t: "footer",
        label: "Full Changelog",
        href: "https://github.com/Vittv/bcp/compare/v0.3.2...v0.3.3",
      },
    ]);
  });

  test("h3 subheading and bare footer url", () => {
    const md = `# bcp v0.4.0\n\n### Bible\n\nNew text.\n\n**Full Changelog**: https://example.com/c`;
    const blocks = parseChangelogMarkdown(md);
    expect(blocks[1]).toEqual({ t: "heading", level: 3, text: "Bible" });
    expect(blocks[3]).toMatchObject({
      t: "footer",
      href: "https://example.com/c",
    });
  });

  test("star bullets and star bullet marker", () => {
    const blocks = parseChangelogMarkdown("# t\n\n* one\n* two\n");
    expect(blocks[1]).toEqual({ t: "bullets", items: ["one", "two"] });
  });

  test("paragraph continuation lines join with a space", () => {
    const blocks = parseChangelogMarkdown("# t\n\nfirst line\nsecond line\n");
    expect(blocks[1]).toEqual({
      t: "paragraph",
      text: "first line second line",
    });
  });

  test("blank line between a paragraph and bullets", () => {
    const md = `# t\n\na paragraph\n\n- item\n`;
    const blocks = parseChangelogMarkdown(md);
    expect(blocks).toHaveLength(3);
    expect(blocks[1]).toEqual({ t: "paragraph", text: "a paragraph" });
    expect(blocks[2]).toEqual({ t: "bullets", items: ["item"] });
  });

  test("crlf input normalizes", () => {
    const blocks = parseChangelogMarkdown("# t\r\n\r\n- a\r\n");
    expect(blocks).toEqual([
      { t: "title", text: "t" },
      { t: "bullets", items: ["a"] },
    ]);
  });
});
