// vim-style keyboard navigation helpers: hint alphabet and DOM scrolling.

// the characters used to build link-hint labels. ordered so the home-row
// keys come first, as vimium does.
export const HINT_ALPHABET = "sadfjklewcmpghiuonrytq";

// build sequential hint labels. the first N are a single char, the rest are
// two chars, so the most common targets get the shortest hints.
export function hintLabels(count: number): string[] {
  const a = HINT_ALPHABET.split("");
  const n = a.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < n) {
      out.push(a[i]);
    } else {
      out.push(a[Math.floor((i - n) / n)] + a[i % n]);
    }
  }
  return out;
}

export function isScrollable(el: HTMLElement): boolean {
  return el.scrollHeight > el.clientHeight + 1;
}

// resolve the current vertical scroller: the focused element or its nearest
// scrollable ancestor, falling back to the outer scroller, then the reference
// split detail pane. lets j/k/d/u/gg/G follow whichever pane has keyboard
// focus rather than hard-coding one container.
// the pane an index picker owns: the focusable list container whose scroll
// region is a child, so walking ancestors will not find it.
function listPaneScroller(): HTMLElement | null {
  // SAFETY: the active element is always an Element; closest() exists on all
  // Elements, so the HTMLElement cast is safe for the DOM elements we query
  const focus = document.activeElement as HTMLElement | null;
  if (!focus?.closest("[data-split-list]")) return null;
  // the pane wraps a single scrollable region (SPLIT_LIST_SCROLL_STYLE);
  // return the first overflow container so d/u/gg/G follow the picker too
  const scroller = focus
    .closest("[data-split-list]")
    ?.querySelector<HTMLElement>("[data-split-list-scroll]");
  return scroller && isScrollable(scroller) ? scroller : null;
}

export function activeScrollTarget(
  outer: HTMLElement | null,
): HTMLElement | null {
  // SAFETY: activeElement is always an Element, and isScrollable below only
  // reads scrollHeight/clientHeight, so the HTMLElement cast is valid to call
  let el = document.activeElement as HTMLElement | null;
  while (el && el !== document.body) {
    if (isScrollable(el)) return el;
    el = el.parentElement;
  }
  // a focused index picker holds focus on its container, not its scroller:
  // resolve the pane's scroll region before falling back to the detail
  if (el) {
    const pane = listPaneScroller();
    if (pane) return pane;
  }
  if (outer && isScrollable(outer)) return outer;
  // SAFETY: the split detail pane is always a real DOM scroller (an
  // HTMLElement), not an SVGTextElement or documentNode, so the cast is safe
  const detail = document.querySelector(
    "[data-split-detail]",
  ) as HTMLElement | null;
  if (detail && isScrollable(detail)) return detail;
  return outer && isScrollable(outer) ? outer : null;
}
