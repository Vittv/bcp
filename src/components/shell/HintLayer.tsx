import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { hintLabels } from "../../lib/input/vim";

export interface HintHandle {
  start: () => void;
  cancel: () => void;
  isActive: () => boolean;
  // returns true when the key was consumed by hint mode
  handleKey: (e: KeyboardEvent) => boolean;
}

interface Target {
  el: HTMLElement;
  label: string;
  rect: { left: number; top: number };
}

interface Badge {
  label: string;
  left: number;
  top: number;
  active: boolean;
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

// whether an element is a hintable click target. role/native-tag first, then
// the RNW Pressable signal: a focusable element (tabindex) that is not a
// scroll container, not a form field, and is a leaf pressable.
function isClickable(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return false;
  if (el.matches(TAG_SELECTOR) || el.matches(ROLE_SELECTOR)) return true;
  if (isScrollContainer(el)) return false;
  if (el === document.body || el === document.documentElement) return false;
  if (el.tabIndex >= 0) {
    const role = el.getAttribute("role");
    // a focusable non-control is a good Pressable candidate unless it is an
    // editable-looking box or a layout pane
    if (role !== "textbox") return true;
  }
  return false;
}

function collectTargets(): Target[] {
  const candidates: HTMLElement[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("*")) {
    if (!isClickable(el)) continue;
    // window chrome (close/min/max, drag regions) must never become a hint
    // target: activating one through a keyboard hint would actually close,
    // resize or move the app window
    if (el.closest("[data-vim-hint-skip]")) continue;
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

export const HintLayer = forwardRef<HintHandle>(
  function HintLayer(_props, ref) {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [filter, setFilter] = useState("");
    const [hinting, setHinting] = useState(false);
    const active = useRef(false);
    const registry = useRef<Target[]>([]);
    const typed = useRef("");

    const scan = useCallback(() => {
      registry.current = collectTargets();
      typed.current = "";
      setFilter("");
      setBadges(
        registry.current.map((t) => ({
          label: t.label,
          left: t.rect.left,
          top: t.rect.top,
          active: true,
        })),
      );
    }, []);

    // re-scan while scrolling so badges track the moving content. also
    // re-scan if the layout changes (overlay/iframe etc). debounced lightly.
    useEffect(() => {
      if (!active.current) return;
      let raf = 0;
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(scan);
      };
      window.addEventListener("scroll", onScroll, true);
      const t = window.setTimeout(scan, 16);
      return () => {
        window.removeEventListener("scroll", onScroll, true);
        window.clearTimeout(t);
        cancelAnimationFrame(raf);
      };
    }, [scan]);

    useImperativeHandle(
      ref,
      () => ({
        start() {
          if (!active.current) {
            active.current = true;
            setHinting(true);
            scan();
          }
        },
        cancel() {
          active.current = false;
          setHinting(false);
          registry.current = [];
          typed.current = "";
          setFilter("");
          setBadges([]);
        },
        isActive() {
          return active.current;
        },
        handleKey(e: KeyboardEvent) {
          if (!active.current) return false;
          if (e.key === "Escape") {
            this.cancel();
            return true;
          }
          // consume everything else while hinting so nothing leaks through
          if (e.key === "Enter") {
            // pick the first active target
            const match = registry.current.find((t) =>
              t.label.startsWith(typed.current ?? ""),
            );
            if (match) match.el.click();
            this.cancel();
            return true;
          }
          if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
            const next = (typed.current ?? "") + e.key.toLowerCase();
            typed.current = next;
            setFilter(next);
            const matches = registry.current.filter((t) =>
              t.label.startsWith(next),
            );
            if (matches.length === 1) {
              matches[0].el.click();
              this.cancel();
            } else if (matches.length === 0) {
              // no match: reset so the user can try again
              typed.current = "";
              setFilter("");
            }
            setBadges(
              registry.current.map((t) => ({
                label: t.label,
                left: t.rect.left,
                top: t.rect.top,
                active: t.label.startsWith(next),
              })),
            );
            return true;
          }
          return true;
        },
      }),
      [scan],
    );

    if (!hinting) return null;

    return (
      <div
        className="vim-hint-layer"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483000,
          pointerEvents: "none",
        }}
      >
        {filter ? (
          <div
            style={{
              position: "fixed",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 13,
              fontWeight: "700",
              letterSpacing: 1,
              color: "var(--hint-text, #c85f8b)",
              background: "var(--hint-bg, #262425)",
              border: "1px solid var(--border-content, #a59d92)",
              borderRadius: 6,
              padding: "4px 10px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            }}
          >
            {filter.toUpperCase()}
          </div>
        ) : null}
        {badges.map((b) => (
          <div
            key={b.label + b.left + b.top}
            style={{
              position: "fixed",
              left: b.left,
              top: b.top,
              transform: "translate(-2px, -2px)",
              pointerEvents: "none",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 0.5,
              lineHeight: "18px",
              padding: "0 6px",
              borderRadius: 4,
              color: b.active
                ? "var(--hint-text, #c85f8b)"
                : "var(--text-secondary, #6b6159)",
              background: b.active
                ? "var(--hint-bg, #262425)"
                : "var(--bg-raised, #ece7dd)",
              border: "1px solid var(--border-content, #a59d92)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
              opacity: b.active ? 1 : 0.45,
            }}
          >
            {b.label.toUpperCase()}
          </div>
        ))}
      </div>
    );
  },
);
