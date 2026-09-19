import type { PageId } from "../../components/shell/Sidebar";

// left/right arrows walk each content page's reading sequence, the same
// linear order its index lists (psalms 1-150, bible chapters, collects in
// printed order), never browser history. a component that owns a sequence
// registers one stepper for the page it handles while that page is active;
// the shell's keydown asks by the active page id.

export type PageStepper = (delta: number) => boolean;

const steppers = new Map<PageId, PageStepper>();

export function registerPageStepper(
  page: PageId,
  step: PageStepper | null,
): void {
  if (step === null) steppers.delete(page);
  else steppers.set(page, step);
}

// call the active page's stepper; returns false when the page has no
// sequence or the step would leave it, so the arrow key does nothing extra
export function stepPageSequence(page: PageId, delta: number): boolean {
  const step = steppers.get(page);
  return step ? step(delta) : false;
}

// clamp a fixed 1..n run by one step (the psalms and proverbs bars)
export function stepLinear(
  current: number,
  min: number,
  max: number,
  delta: number,
): number | null {
  const next = current + delta;
  return next >= min && next <= max ? next : null;
}

// step an arbitrary ordered list from the item matching `current`; the
// step returns null when the item is absent or the move leaves the list
export function stepIndexed<T>(
  items: readonly T[],
  current: T,
  delta: number,
  equal: (a: T, b: T) => boolean,
): T | null {
  const i = items.findIndex((item) => equal(item, current));
  if (i === -1) return null;
  const next = i + delta;
  return next >= 0 && next < items.length ? items[next] : null;
}
