// module-level pending selections for cross-page global navigation.
// a global palette pick can target a reference page that is not active; the
// selection is stored here so the page applies it on entry in one history
// step (mirrors the bible reader's pending-ref pattern) instead of pushing a
// stale field-only step on the source page.

import type { HistorySnapshot } from "../../../context/HistoryContext";

export type PendingReferencePick = Partial<
  Pick<
    HistorySnapshot,
    | "psalm"
    | "psalterDay"
    | "collect"
    | "saint"
    | "lesserFeast"
    | "proverb"
    | "canticle"
  >
>;

let _pending: PendingReferencePick | null = null;

export function setPendingReferencePick(pick: PendingReferencePick): void {
  _pending = pick;
}

export function consumePendingReferencePick(): PendingReferencePick | null {
  const pick = _pending;
  _pending = null;
  return pick;
}
