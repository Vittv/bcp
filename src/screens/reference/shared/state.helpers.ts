import type { PageId } from "../../../components/shell/Sidebar";
import { lesserFeastBySlug } from "../../../lib/calendar/lesserFeasts";
import { sanctoraleBySlug } from "../../../lib/calendar/sanctorale";
import { canticleTitle } from "../../../lib/content/canticles";
import { psalmNumbers } from "../../../lib/content/psalter";
import {
  PSALTER_DAY_COUNT,
  psalterDayForDate,
} from "../../../lib/content/psalterDays";
import type { PageStepper } from "../../../lib/input/sequenceNav";
import {
  registerPageStepper,
  stepLinear,
} from "../../../lib/input/sequenceNav";
import {
  type CollectSel,
  defaultLesserFeast,
  defaultSaint,
  FIRST_COLLECT,
  OFFICE_NAMES,
  type OfficeRite,
  type RefOfficeBase,
  refOfficeId,
  today,
} from "./model";

export function readingLabelFor(args: {
  page: PageId;
  openPsalm: number | null;
  openPsalterDay: number | null;
  openOffice: RefOfficeBase | null;
  officeRite: OfficeRite;
  selectedCollect: CollectSel | null;
  openSaint: string | null;
  openLesserFeast: string | null;
  openProvChapter: number | null;
  openCanticle: number | null;
}): string | null {
  const {
    page,
    openPsalm,
    openPsalterDay,
    openOffice,
    officeRite,
    selectedCollect,
    openSaint,
    openLesserFeast,
    openProvChapter,
    openCanticle,
  } = args;

  return page === "psalms"
    ? `Psalm ${openPsalm ?? 1}`
    : page === "psalter"
      ? `Day ${openPsalterDay ?? psalterDayForDate(today())}`
      : page === "offices"
        ? OFFICE_NAMES[refOfficeId(openOffice ?? "morning", officeRite)]
        : page === "collects"
          ? (selectedCollect ?? FIRST_COLLECT).title
          : page === "saints"
            ? (sanctoraleBySlug(openSaint ?? defaultSaint())?.title ?? null)
            : page === "lesser-feasts"
              ? (lesserFeastBySlug(openLesserFeast ?? defaultLesserFeast())
                  ?.name ?? null)
              : page === "proverbs"
                ? `Proverbs ${openProvChapter ?? 1}`
                : page === "canticles"
                  ? (canticleTitle(openCanticle ?? 1) ?? null)
                  : null;
}

export function registerScriptureStepper(args: {
  page: PageId;
  openPsalm: number | null;
  setPsalmRaw: (n: number | null) => void;
  openPsalterDay: number | null;
  setPsalterDayRaw: (n: number | null) => void;
  openProvChapter: number | null;
  setProverbRaw: (n: number | null) => void;
}): (() => void) | undefined {
  const {
    page,
    openPsalm,
    setPsalmRaw,
    openPsalterDay,
    setPsalterDayRaw,
    openProvChapter,
    setProverbRaw,
  } = args;

  let step: PageStepper | null = null;
  switch (page) {
    case "psalms": {
      const max = psalmNumbers().length;
      step = (delta) => {
        const n = stepLinear(openPsalm ?? 1, 1, max, delta);
        if (n === null) return false;
        setPsalmRaw(n);
        return true;
      };
      break;
    }
    case "psalter":
      step = (delta) => {
        const n = stepLinear(
          openPsalterDay ?? psalterDayForDate(today()),
          1,
          PSALTER_DAY_COUNT,
          delta,
        );
        if (n === null) return false;
        setPsalterDayRaw(n);
        return true;
      };
      break;
    case "proverbs":
      // 31 chapters, the same count the proverbs screen hard-codes
      step = (delta) => {
        const n = stepLinear(openProvChapter ?? 1, 1, 31, delta);
        if (n === null) return false;
        setProverbRaw(n);
        return true;
      };
      break;
    default:
      step = null;
  }
  if (!step) return;
  registerPageStepper(page, step);
  return () => registerPageStepper(page, null);
}
