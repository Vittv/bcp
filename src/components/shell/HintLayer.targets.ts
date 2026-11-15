import { hintLabels } from "../../lib/input/vim";

export interface Target {
  el: HTMLElement;
  label: string;
  rect: { left: number; top: number };
}

// interactive roles mapped to clickable targets. native form controls and
// anchors are also covered. RNW Pressables without an accessibilityRole have
// no role but get a focusable tabindex, so the runtime clickable check below
// catches them too (React delegates handlers, so no [onclick] attribute to
// rely on).
const ROLE_SELECTOR =
  '[role="button"], [role="tab"], [role="link"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="switch"], [role="combobox"], [role="option"], [role="listbox"], [role="gridcell"]';
const TAG_SELECTOR = "button, a, summary, select";

function isScrollContainer(el: HTMLElement): boolean {
  const oy = window.getComputedStyle(el).overflowY;
  return (
    (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight
  );
}

// whether an element accepts freeform text entry: native text inputs,
// textareas, contenteditable regions and role=textbox boxes. hinting these
// lets a hint focus the focused-in field so typing a search works right away.
export function isTextField(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    // SAFETY: the INPUT tag check above guarantees this node is an input
    const type = (el as HTMLInputElement).type;
    return (
      type === "" ||
      type === "text" ||
      type === "search" ||
      type === "email" ||
      type === "url" ||
      type === "tel" ||
      type === "password" ||
      type === "number"
    );
  }
  return el.getAttribute("role") === "textbox" || el.isContentEditable === true;
}

// whether an element is a hintable click target. role/native-tag first, then
// the RNW Pressable signal: a focusable element (tabindex) that is not a
// scroll container, not a form field, and is a leaf pressable. text-entry
// controls are kept so a hint can hand focus to a search box.
function isClickable(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return isTextField(el);
  if (el.matches(TAG_SELECTOR) || el.matches(ROLE_SELECTOR)) return true;
  if (isScrollContainer(el)) return false;
  if (el === document.body || el === document.documentElement) return false;
  if (el.tabIndex >= 0) {
    // a focusable non-control is a good Pressable candidate
    return true;
  }
  return false;
}

export function collectTargets(): Target[] {
  const candidates: HTMLElement[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("*")) {
    if (!isClickable(el)) continue;
    // window chrome (close/min/max, drag regions) must never become a hint
    // target: activating one through a keyboard hint would actually close,
    // resize or move the app window
    if (el.closest("[data-vim-hint-skip]")) continue;
    // reference picker rows (data-index-list) flood the target set and make
    // single nav letters ambiguous; the picker search field lives outside
    // that container so it stays hintable. rows are driven with ctrl+j/k.
    if (el.closest("[data-index-list]")) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 6 || rect.height < 6) continue;
    const style = window.getComputedStyle(el);
    if (
      style.visibility === "hidden" ||
      style.display === "none" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }
    if (el.closest('[aria-hidden="true"]')) continue;
    candidates.push(el);
  }

  // drop any ancestor that contains another hintable target: keep the
  // innermost pressable so compound widgets (a button wrapping a nested
  // control) get exactly one hint on the real handler
  const targets = candidates.filter((el) => {
    for (const other of candidates) {
      if (other !== el && el.contains(other)) return false;
    }
    return true;
  });

  return targets
    .sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return ra.top - rb.top || ra.left - rb.left;
    })
    .map((el, i) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        label: hintLabels(targets.length)[i],
        rect: { left: r.left, top: r.top },
      };
    });
}
