#!/usr/bin/env bun
/**
 * Tiny markdown parser for release notes, kept deliberately small because
 * RELEASE.md is the only input and the modal renders it with plain views.
 *
 * The grammar mirrors build-changelog.ts: a `# ` title, `## `/`### `
 * sections, paragraphs, `- `/`* ` bullet runs, inline **bold**, `code` and
 * [links](url), and a trailing `**Full Changelog**: <url>` footer link.
 * Everything else is treated as prose so an unexpected line never crashes
 * the modal.
 */

export type InlineNode =
  | { t: "text"; value: string }
  | { t: "bold"; children: InlineNode[] }
  | { t: "code"; value: string }
  | { t: "link"; href: string; children: InlineNode[] };

export type ChangelogBlock =
  | { t: "title"; text: string }
  | { t: "heading"; level: 2 | 3; text: string }
  | { t: "paragraph"; text: string }
  | { t: "bullets"; items: string[] }
  | { t: "footer"; label: string; href: string };

// split a text into styled spans: **bold**, `code` and [label](url), with
// plain text between them; bold and link labels can nest their own spans.
// the pattern is rebuilt per call because it carries /g (lastIndex) state,
// and a nested parseInline would clobber a shared instance's position
// mid-loop, re-matching the same span forever
const INLINE_TOKEN_SOURCE =
  "\\*\\*[^*]+\\*\\*|`[^`]+`|\\[[^\\]]+\\]\\([^)]*\\)";

export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  const tokenRe = new RegExp(INLINE_TOKEN_SOURCE, "g");
  for (
    match = tokenRe.exec(source);
    match !== null;
    match = tokenRe.exec(source)
  ) {
    const token = match[0];
    if (match.index > cursor) {
      nodes.push({ t: "text", value: source.slice(cursor, match.index) });
    }
    if (token.startsWith("**")) {
      nodes.push({ t: "bold", children: parseInline(token.slice(2, -2)) });
    } else if (token.startsWith("`")) {
      nodes.push({ t: "code", value: token.slice(1, -1) });
    } else {
      const close = token.lastIndexOf("](");
      nodes.push({
        t: "link",
        href: token.slice(close + 2, -1),
        children: parseInline(token.slice(1, close)),
      });
    }
    cursor = match.index + token.length;
  }
  if (cursor < source.length) {
    nodes.push({ t: "text", value: source.slice(cursor) });
  }
  return nodes;
}

// the footer line that ends every release note, e.g.
// `**Full Changelog**: <https://...>` with or without the angle brackets
function footerLink(text: string): { label: string; href: string } | null {
  const match = text.match(/^\*\*Full Changelog\*\*:\s*(.+)$/);
  if (!match) return null;
  let href = match[1].trim();
  if (href.startsWith("<") && href.endsWith(">")) href = href.slice(1, -1);
  return href ? { label: "Full Changelog", href } : null;
}

function flushParagraph(blocks: ChangelogBlock[], para: string[]): void {
  if (!para.length) return;
  const text = para.join(" ");
  const footer = footerLink(text);
  if (footer) blocks.push({ t: "footer", ...footer });
  else blocks.push({ t: "paragraph", text });
}

export function parseChangelogMarkdown(markdown: string): ChangelogBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ChangelogBlock[] = [];
  let para: string[] = [];
  let bullets: string[] = [];

  const flushBullets = (): void => {
    if (!bullets.length) return;
    blocks.push({ t: "bullets", items: bullets });
    bullets = [];
  };
  const flushAll = (): void => {
    flushBullets();
    flushParagraph(blocks, para);
    para = [];
  };

  for (const line of lines) {
    const lineText = line.trim();
    if (lineText === "") {
      flushBullets();
      flushParagraph(blocks, para);
      para = [];
      continue;
    }
    if (lineText.startsWith("# ")) {
      flushAll();
      blocks.push({ t: "title", text: lineText.slice(2).trim() });
      continue;
    }
    const heading = lineText.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushAll();
      blocks.push({
        t: "heading",
        level: heading[1].length === 2 ? 2 : 3,
        text: heading[2].trim(),
      });
      continue;
    }
    const bullet = lineText.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph(blocks, para);
      para = [];
      bullets.push(bullet[1].trim());
      continue;
    }
    flushBullets();
    para.push(lineText);
  }
  flushAll();
  return blocks;
}
