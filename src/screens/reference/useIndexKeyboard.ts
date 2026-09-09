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

// keep the cursor row in view as it moves. only the active picker renders an
// index list (data-index-list), and the cursor row is the nth role=button
// inside it (the grouped-list headings are not buttons). runs from the key
// handler and the filter clamp, i.e. before React re-renders, so layout is
// still cached and reads are cheap. it touches only the owning scroller, and
// only when the row actually leaves the visible region (the cmdk/datalist
// feel): a row above the top scrolls up, one past the bottom scrolls down.
function scrollCursorIntoView(cursor: number): void {
  const list = document.querySelector("[data-index-list]");
  if (!list) return;
  const scroller =
    list.closest<HTMLElement>("[data-palette-list]") ??
    list.closest<HTMLElement>("[data-split-list-scroll]");
  if (!scroller) return;
  // SAFETY: buttons are DOM Elements with getBoundingClientRect; the generic
  // narrows the collection, no runtime cast is performed
  const rows = Array.from(
    list.querySelectorAll<HTMLElement>('[role="button"]'),
  );
  const row = rows[cursor];
  if (!row) return;
  const scrollerTop = scroller.getBoundingClientRect().top;
  const top = row.getBoundingClientRect().top - scrollerTop;
  const bottom = top + row.getBoundingClientRect().height;
  if (top < 0) scroller.scrollTop += top;
  else if (bottom > scroller.clientHeight)
    scroller.scrollTop += bottom - scroller.clientHeight;
}

// vim/fzf-style row navigation for the reference index lists, sharing the
// active row between keyboard and mouse exactly like cmdk. keyboard moves
// (ctrl+j/ctrl+k and ArrowUp/ArrowDown) drive the cursor and scroll it into
// view; the pointer drags the same cursor as a document-level mousemove that
// picks the row under it, so both inputs paint the one highlight. the mouse
// never scrolls: mousemove only fires when the pointer actually moves (never
// on wheel scrolling under a static pointer) and the movement guard drops
// stray zero-move events, so hovering can't re-anchor the cursor mid-scroll.
// Enter opens whichever row is active. only active on web and only while a
// list is mounted (i.e. the palette is open).
export function useIndexKeyboard<T>(
  movable: T[],
  onEnter: (index: number, value: T) => void,
): {
  cursor: number;
  move: (delta: number) => void;
} {
  const [cursor, setCursor] = useState(0);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const movableRef = useRef(movable);
  movableRef.current = movable;

  // a fresh (clamped) list parks the cursor back inside it: if the filter
  // collapses the rows, the cursor clamps to the tail; an unrelated identity
  // change keeps the position the user is on. the scrolled position follows
  // the clamp right away
  useEffect(() => {
    if (movable.length === 0) return;
    if (IS_WEB)
      scrollCursorIntoView(Math.min(cursorRef.current, movable.length - 1));
    setCursor((c) =>
      c >= movable.length ? Math.max(0, movable.length - 1) : c,
    );
  }, [movable]);

  const move = useCallback((delta: number) => {
    const n = movableRef.current.length;
    if (n === 0) return;
    const next = Math.max(0, Math.min(n - 1, cursorRef.current + delta));
    setCursor(next);
    // scroll before React commits, while layout is still cached, so the
    // follow is a single cheap read/write instead of a post-render reflow.
    // only move()/the clamp scroll; the mouse repaint below never does
    if (IS_WEB) scrollCursorIntoView(next);
  }, []);

  // the pointer follows the cursor (cmdk's trick): a capture-phase mousemove
  // maps the element under the pointer onto the list's buttons and repaints
  // the active row in place, without ever scrolling. coalesced to a single
  // pending rAF (each move replaces the queued one) so a fast pointer scan
  // never stacks up hit-tests past the next paint; the movement guard keeps
  // scroll-created no-ops out
  useEffect(() => {
    if (!IS_WEB) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (movableRef.current.length === 0) return;
      if (e.movementX === 0 && e.movementY === 0) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (movableRef.current.length === 0) return;
        const list = document.querySelector("[data-index-list]");
        if (!list) return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const row = target?.closest<HTMLElement>('[role="button"]');
        if (!row || !list.contains(row)) return;
        let i = 0;
        for (const rowEl of list.querySelectorAll<HTMLElement>(
          '[role="button"]',
        )) {
          if (rowEl === row) {
            const next = Math.min(i, movableRef.current.length - 1);
            if (next !== cursorRef.current) setCursor(next);
            return;
          }
          i++;
        }
      });
    };
    window.addEventListener("mousemove", onMove, true);
    return () => {
      window.removeEventListener("mousemove", onMove, true);
      cancelAnimationFrame(raf);
    };
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
          // bare j/k always types (the picker search needs its letters):
          // only ctrl+j / ctrl+k move the cursor. ctrl+j is also the
          // browser's downloads shortcut, so once we commit to moving we
          // must not let the page see it
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
