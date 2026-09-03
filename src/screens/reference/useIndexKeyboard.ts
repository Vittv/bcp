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

// vim-style row navigation for the reference index lists. tracks a keyboard
// cursor index into the (possibly filtered) list and moves it with
// j/k / ArrowUp / ArrowDown, opening the focused row on Enter. only active
// on web and only while the list is on screen; ignores keystrokes meant for
// an editable field.
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
      if (isEditable(e.target)) return;
      if (movableRef.current.length === 0) return;
      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          e.stopImmediatePropagation();
          move(1);
          return;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          e.stopImmediatePropagation();
          move(-1);
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
// the cursor row is the nth role=button inside it. scrolling it into the
// nearest edge avoids jumping the page. only one index renders at a time.
export function useCursorScroll(cursor: number) {
  useEffect(() => {
    const list = document.querySelector("[data-index-list]");
    if (!list) return;
    // SAFETY: buttons are DOM Elements with scrollIntoView; the generic
    // narrows the collection, no runtime cast is performed
    const rows = Array.from(
      list.querySelectorAll<HTMLElement>('[role="button"]'),
    );
    rows[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);
}
