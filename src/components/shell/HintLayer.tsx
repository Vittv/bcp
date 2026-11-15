import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { collectTargets, isTextField, type Target } from "./HintLayer.targets";

export interface HintHandle {
  start: () => void;
  cancel: () => void;
  isActive: () => boolean;
  // returns true when the key was consumed by hint mode
  handleKey: (e: KeyboardEvent) => boolean;
}

interface Badge {
  label: string;
  left: number;
  top: number;
  active: boolean;
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
        // hand focus to a text field (so the user can start typing a search)
        // or click any other target
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
            if (match) {
              if (isTextField(match.el)) match.el.focus();
              else match.el.click();
            }
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
              if (isTextField(matches[0].el)) matches[0].el.focus();
              else matches[0].el.click();
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
              color: "var(--hint-text)",
              background: "var(--hint-bg)",
              border: "1px solid var(--border-content)",
              borderRadius: 6,
              padding: "4px 10px",
              boxShadow: "0 4px 14px var(--shadow-soft)",
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
              color: b.active ? "var(--hint-text)" : "var(--text-secondary)",
              background: b.active ? "var(--hint-bg)" : "var(--bg-raised)",
              border: "1px solid var(--border-content)",
              boxShadow: "0 2px 6px var(--shadow-strong)",
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
