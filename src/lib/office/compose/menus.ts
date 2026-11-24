import type { OfficeSection } from "../../content/types";
import type { MenuChoiceOption, OfficeMenus } from "../types";
import type { ComposeContext, MenuBlock, MenuRegions } from "./shared";

// the printed rubrics that open each menu
const PSALM_MENU_RUBRIC = /one or more of the following Psalms/i;
const READING_MENU_RUBRIC =
  /one of the following, or some other suitable passage/i;
const COLLECT_MENU_RUBRIC = /says one of the following Collect/;
const PSALM_HEAD = /^(?:From )?Psalm (\d+)\s*(.*)/;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

// walk the section once and record where each printed menu begins, the
// alternatives it carries, and where it ends
export function menuRegions(section: OfficeSection): MenuRegions {
  const items = section.items;
  const regions: MenuRegions = { psalms: [], readings: [], collects: [] };
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== "rubric") continue;
    if (
      regions.psalmRubric === undefined &&
      PSALM_MENU_RUBRIC.test(item.text)
    ) {
      regions.psalmRubric = i;
      for (let j = i + 1; j < items.length; j++) {
        const probe = items[j];
        if (
          probe.kind === "rubric" &&
          /At the end of the Psalms/i.test(probe.text)
        ) {
          regions.gloriaRubric = j;
          break;
        }
        if (probe.kind !== "heading") continue;
        const match = probe.text.match(PSALM_HEAD);
        if (!match) continue;
        const psalm = Number(match[1]);
        let to = j;
        while (items[to + 1]?.kind === "text") to++;
        regions.psalms.push({
          heading: j,
          from: j + 1,
          to,
          psalm,
          id: String(psalm),
          incipit: match[2]?.trim() || undefined,
        });
        j = to;
      }
      i = regions.gloriaRubric ?? i;
      continue;
    }
    if (
      regions.readingRubric === undefined &&
      READING_MENU_RUBRIC.test(item.text)
    ) {
      regions.readingRubric = i;
      const menu: MenuBlock[] = [];
      let j = i + 1;
      while (j < items.length) {
        const probe = items[j];
        if (probe.kind === "option") {
          j++;
          continue;
        }
        if (probe.kind !== "text") break;
        const from = j;
        const citation = probe.citation;
        while (j < items.length && items[j].kind === "text") j++;
        const fallback = `Reading ${menu.length + 1}`;
        const label = citation && citation.length > 0 ? citation : fallback;
        menu.push({
          from,
          to: j - 1,
          id: label,
          label,
          menuLabel: label,
          group: "Appointed",
        });
      }
      regions.readings = menu;
      regions.readingEnd = j;
      i = j - 1;
      continue;
    }
    if (
      regions.collectRubric === undefined &&
      COLLECT_MENU_RUBRIC.test(item.text)
    ) {
      regions.collectRubric = i;
      const menu: MenuBlock[] = [];
      let j = i + 1;
      while (j < items.length) {
        const probe = items[j];
        if (
          probe.kind === "rubric" &&
          probe.text.startsWith("A Collect for ")
        ) {
          const from = j;
          j++;
          while (items[j]?.kind === "text") j++;
          menu.push({
            from,
            to: j - 1,
            id: probe.text,
            label: probe.text,
            menuLabel: probe.text,
            group: "Appointed",
            title: probe.text,
          });
          continue;
        }
        if (probe.kind !== "text") break;
        const from = j;
        const body = probe.text;
        let amen = false;
        while (j < items.length && items[j].kind === "text") {
          amen = items[j].text === "Amen.";
          j++;
          if (amen) break;
        }
        menu.push({
          from,
          to: j - 1,
          id: String(menu.length + 1),
          label: truncate(body, 34),
          menuLabel: truncate(body, 64),
          group: "Appointed",
        });
      }
      regions.collects = menu;
      regions.collectEnd = j;
      i = j - 1;
    }
  }
  return regions;
}

// morning and evening print a titled collect followed by its text and Amen.
// "The Collect of the Day" is emitted separately from the lectionary, so its
// rubric is skipped here and offered as the suggested picker option instead.
export function titledCollectBlocks(section: OfficeSection): MenuBlock[] {
  const items = section.items;
  const start = items.findIndex(
    (item) =>
      item.kind === "rubric" &&
      /one or more of the following Collects/i.test(item.text),
  );
  if (start < 0) return [];
  const blocks: MenuBlock[] = [];
  let i = start + 1;
  while (i < items.length && items[i].kind === "rubric") {
    const title = items[i].text;
    if (title === "The Collect of the Day") {
      i++;
      continue;
    }
    if (!title.startsWith("A Collect for ")) break;
    i++;
    const from = i;
    while (i < items.length && items[i].kind === "text") i++;
    blocks.push({
      from,
      to: i - 1,
      id: title,
      label: title,
      // rows show the collect's printed heading, not its opening words
      menuLabel: title,
      group: "Appointed",
      title,
    });
  }
  return blocks;
}

// the closing of morning and evening prints three blessings, each a prayer
// line followed by the people's "Amen."
const BLESSING_RUBRIC = /may then conclude with one of the following/i;

export function blessingBlocks(section: OfficeSection): MenuBlock[] {
  const items = section.items;
  const start = items.findIndex(
    (item) => item.kind === "rubric" && BLESSING_RUBRIC.test(item.text),
  );
  if (start < 0) return [];
  const blocks: MenuBlock[] = [];
  let i = start + 1;
  while (i < items.length && items[i].kind === "text") {
    const from = i;
    const body = items[i].text;
    i++;
    // the people's Amen closes this blessing and carries its citation
    const amen = items[i];
    if (amen && amen.kind === "text" && amen.speaker === "people") {
      i++;
    }
    blocks.push({
      from,
      to: i - 1,
      id: String(blocks.length + 1),
      label: truncate(body, 32),
      menuLabel: truncate(body, 64),
      group: "Appointed",
    });
  }
  return blocks;
}

// the three mission prayers of morning and evening are printed as text runs
// separated by "or this"/"or the following" options, after the "Then, unless
// the Eucharist" rubric and before the "Here may be sung" rubric
const MISSION_RUBRIC = /Then, unless the Eucharist/i;

export function missionMenuBlocks(section: OfficeSection): MenuBlock[] {
  const items = section.items;
  const start = items.findIndex(
    (item) => item.kind === "rubric" && MISSION_RUBRIC.test(item.text),
  );
  if (start < 0) return [];
  const blocks: MenuBlock[] = [];
  let i = start + 1;
  while (i < items.length && items[i].kind !== "rubric") {
    if (items[i].kind === "option") {
      i++;
      continue;
    }
    if (items[i].kind !== "text") break;
    const from = i;
    const body = items[i].text;
    while (i < items.length && items[i].kind === "text") i++;
    blocks.push({
      from,
      to: i - 1,
      id: String(blocks.length + 1),
      label: truncate(body, 32),
      menuLabel: truncate(body, 64),
      group: "Appointed",
    });
  }
  return blocks;
}

// an override that names no printed option degrades to the fallback id
export function chosenOf(
  blocks: readonly { id: string }[],
  override: string | undefined,
  fallback: string,
): string {
  if (override && blocks.some((block) => block.id === override))
    return override;
  return fallback;
}

export function buildOfficeMenus(
  ctx: ComposeContext,
  hasDayCollect: boolean,
): OfficeMenus | undefined {
  const menus: OfficeMenus = {};
  const blessings = ctx.blessingBlocks;
  if (blessings && blessings.length > 1) {
    const [first, ...rest] = blessings;
    menus.blessing = {
      options: [
        {
          id: "suggested",
          label: first.label,
          menuLabel: first.menuLabel,
          group: "Suggested",
        },
        ...rest.map((block) => ({
          id: block.id,
          label: block.label,
          menuLabel: block.menuLabel,
          group: block.group,
        })),
      ],
    };
  }
  const collects = ctx.collectBlocks;
  if (collects && collects.length > 0) {
    const options: MenuChoiceOption[] = [
      {
        id: "suggested",
        label: "Collect of the Day",
        menuLabel: "The Collect of the Day",
        group: "Suggested",
      },
      ...collects.map((block) => ({
        id: block.id,
        label: block.label,
        menuLabel: block.menuLabel,
        group: block.group,
      })),
    ];
    menus.collect = { options };
  }
  const blocks = ctx.missionBlocks;
  if (blocks && blocks.length > 1) {
    const [first, ...rest] = blocks;
    menus.mission = {
      options: [
        {
          id: "suggested",
          label: first.label,
          menuLabel: first.menuLabel,
          group: "Suggested",
        },
        ...rest.map((block) => ({
          id: block.id,
          label: block.label,
          menuLabel: block.menuLabel,
          group: block.group,
        })),
      ],
    };
  }
  const regions = ctx.menuRegions;
  if (!regions) return Object.keys(menus).length ? menus : undefined;
  if (regions.psalmRubric !== undefined && regions.psalms.length > 0) {
    const options: MenuChoiceOption[] = [
      {
        id: "suggested",
        label: `All ${regions.psalms.length} psalms`,
        menuLabel: "All psalms",
        group: "Suggested",
      },
      ...regions.psalms.map((block) => ({
        id: block.id,
        label: `Psalm ${block.psalm}`,
        menuLabel: block.incipit
          ? `Psalm ${block.psalm} · ${block.incipit}`
          : `Psalm ${block.psalm} (section)`,
        group: "Appointed",
      })),
    ];
    menus.psalm = { options };
  }
  if (regions.readingRubric !== undefined && regions.readings.length > 1) {
    const [first, ...rest] = regions.readings;
    menus.reading = {
      options: [
        {
          id: "suggested",
          label: first.label,
          menuLabel: first.label,
          group: "Suggested",
        },
        ...rest.map((block) => ({
          id: block.id,
          label: block.label,
          menuLabel: block.menuLabel,
          group: block.group,
        })),
      ],
    };
  }
  if (regions.collectRubric !== undefined && regions.collects.length > 1) {
    const [first, ...rest] = regions.collects;
    const options: MenuChoiceOption[] = [
      {
        id: "suggested",
        label: first.label,
        menuLabel: first.menuLabel,
        group: "Suggested",
      },
      ...rest.map((block) => ({
        id: block.id,
        label: block.label,
        menuLabel: block.menuLabel,
        group: block.group,
      })),
    ];
    // noonday's rubric itself offers the collect of the day as an alternative
    if (ctx.officeId === "noonday" && hasDayCollect) {
      options.push({
        id: "day",
        label: "Collect of the Day",
        menuLabel: "The Collect of the Day",
        group: "Seasonal",
      });
    }
    menus.collect = { options };
  }
  if (Object.keys(menus).length === 0) return undefined;
  return menus;
}
