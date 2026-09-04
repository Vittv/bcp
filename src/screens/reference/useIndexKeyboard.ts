import { useCallback, useEffect, useRef, useState } from "react";

const IS_WEB = typeof window !== "undefined";

function isEditable(el: EventTarget | null): boolean {
  // SAFETY: keydown targets are DOM Elements; the tags we test are always
  // HTMLElements and isContentEditable exists only on HTMLElement, so the
  // cast is safe and anything without a tagName is treated as non-editable
  const t = el as HTMLElement | null;
  if (!t?.tagName) return false;
  const tag = t.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    t.isContentEditable === true
  );
}

// whether the keydown comes from a picker search field, where a type-ahead
// (combobox) workflow should take over: arrows move the row cursor and Enter
// opens the highlighted result, even while the input has focus. other editable
// fields (plain search boxes elsewhere, the office bar, etc.) keep their keys.
function isPickerSearch(el: EventTarget | null): boolean {
  // SAFETY: keydown targets are DOM Elements; closest exists on Elements, so
  // the cast is safe and anything without tagName is treated as non-search
  const t = el as HTMLElement | null;
  return !!t?.closest?.("[data-picker-search]");
}

// vim-style row navigation for the reference index lists. tracks a keyboard
// cursor index into the (possibly filtered) list and moves it with
// ctrl+j / ctrl+k / ArrowUp / ArrowDown, opening the focused row on Enter.
// the bare j/k keys are reserved for scrolling the main content pane, so the
// picker only moves under ctrl. only active on web and only while the list is
// on screen; normally ignores keystrokes meant for an editable field, but a
// picker search box (data-picker-search) lets arrows+Enter drive the cursor
// directly, so typing a filter and picking with the keyboard is one motion.
export function useIndexKeyboard<T>(
  movable: T[],
  onEnter: (index: number, value: T) => void,
): { cursor: number; move: (delta: number) => void } {
  const [cursor, setCursor] = useState(0);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const movableRef = useRef(movable);
  movableRef.current = movable;

  // a fresh (clamped) list parks the cursor back inside it: if the filter
  // collapses the rows, the cursor clamps to the tail; an unrelated identity
  // change keeps the position the user is on
  useEffect(() => {
    setCursor((c) =>
      c >= movable.length ? Math.max(0, movable.length - 1) : c,
    );
  }, [movable]);

  const move = useCallback((delta: number) => {
    const n = movableRef.current.length;
    if (n === 0) return;
    setCursor((c) => {
      const next = c + delta;
      return next < 0 ? 0 : next >= n ? n - 1 : next;
    });
  }, []);

  useEffect(() => {
    if (!IS_WEB) return;
    const onKey = (e: KeyboardEvent) => {
      const inPickerSearch = isPickerSearch(e.target);
      if (isEditable(e.target) && !inPickerSearch) return;
      if (movableRef.current.length === 0) return;
      switch (e.key) {
        case "j":
        case "k":
          // j/k only drive the picker under ctrl; the bare keys scroll the
          // main content pane (handled by the shell)
          if (!e.ctrlKey) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          move(e.key === "j" ? 1 : -1);
          return;
        case "ArrowDown":
        case "ArrowUp":
          e.preventDefault();
          e.stopImmediatePropagation();
          move(e.key === "ArrowDown" ? 1 : -1);
          return;
        case "Enter": {
          e.preventDefault();
          e.stopImmediatePropagation();
          const c = cursorRef.current;
          onEnterRef.current(c, movableRef.current[c]);
          return;
        }
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [move]);

  return { cursor, move };
}

// keep the cursor row in view as it moves. the active picker's index list
// marks its container with data-index-list (see each Index's indexBody), so
// the cursor row is the nth role=button inside it. on desktop the rows live
// in the split-pane's own scroller ([data-split-list-scroll]), which we set
// scrollTop on directly so the picked row always stays visible regardless of
// how nesting affects scrollIntoView; on mobile the rows scroll with the
// document column, where scrollIntoView is reliable. only one index renders
// at a time.
export function useCursorScroll(cursor: number) {
  useEffect(() => {
    if (!IS_WEB) return;
    const list = document.querySelector("[data-index-list]");
    if (!list) return;
    // SAFETY: buttons are DOM Elements with scrollIntoView; the generic
    // narrows the collection, no runtime cast is performed
    const rows = Array.from(
      list.querySelectorAll<HTMLElement>('[role="button"]'),
    );
    const row = rows[cursor];
    if (!row) return;
    const scroller = list.closest<HTMLElement>("[data-split-list-scroll]");
    if (!scroller) {
      row.scrollIntoView({ block: "nearest" });
      return;
    }
    const sTop = scroller.getBoundingClientRect().top;
    const rTop = row.getBoundingClientRect().top - sTop;
    const rBottom = rTop + row.getBoundingClientRect().height;
    const viewTop = scroller.scrollTop;
    const viewBottom = viewTop + scroller.clientHeight;
    if (rTop < viewTop) scroller.scrollTop = rTop;
    else if (rBottom > viewBottom)
      scroller.scrollTop = rBottom - scroller.clientHeight;
  }, [cursor]);
}
