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
  const regions = ctx.menuRegions;
  if (!regions) return undefined;
  const menus: OfficeMenus = {};
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
