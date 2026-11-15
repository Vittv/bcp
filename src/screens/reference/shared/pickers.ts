import { type MutableRefObject, useCallback, useRef, useState } from "react";

import type { PageId } from "../../../components/shell/Sidebar";
import type {
  HistoryApi,
  HistorySnapshot,
} from "../../../context/HistoryContext";
import { useHistoryField } from "../../../context/HistoryContext";

// the seven index-style pickers (psalms, psalter days, collects, saints,
// lesser feasts, proverbs, canticles) share one restorable-field
// implementation. null is the picker page: opening pushes the selection, the
// mobile back button pushes null, and restores replay the raw setter (null
// included) so Back from a detail lands back on the list instead of a stale
// open item. picking from a filtered list records that list as its own step
// first, so Back returns to the exact list the pick came from.
export type IndexPickerKey =
  | "psalm"
  | "psalterDay"
  | "collect"
  | "saint"
  | "lesserFeast"
  | "proverb"
  | "canticle";

export function useIndexPicker<K extends IndexPickerKey>(
  key: K,
  pageId: PageId,
  page: PageId,
  history: HistoryApi | null,
  queryRef: MutableRefObject<string>,
): [
  HistorySnapshot[K],
  (v: HistorySnapshot[K]) => void,
  (v: HistorySnapshot[K]) => void,
] {
  const [value, setValue] = useState<HistorySnapshot[K]>(
    // SAFETY: every index-picker key is nullable, and null is the
    // closed/picker state this picker starts in
    null as HistorySnapshot[K],
  );
  const valueRef = useRef(value);
  valueRef.current = value;
  const open = useCallback(
    (v: HistorySnapshot[K]) => {
      if (
        v !== null &&
        page === pageId &&
        valueRef.current === null &&
        queryRef.current !== ""
      ) {
        history?.record();
      }
      setValue(v);
      // SAFETY: key is a keyof HistorySnapshot, so the computed object is
      // exactly a partial snapshot
      history?.push({ [key]: v } as Partial<HistorySnapshot>);
    },
    [page, pageId, key, history, queryRef],
  );
  // the applier is the raw state setter, so a restored snapshot replays
  // both branches: a value reopens the detail, null returns to the picker.
  // the raw setter is also handed out for moves that must not leave a
  // back/forward step behind, like the shell's arrow-key stepping
  useHistoryField(key, () => value, setValue);
  return [value, open, setValue];
}
