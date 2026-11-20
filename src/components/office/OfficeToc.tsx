import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import type { OfficeSectionKey } from "../../lib/content/types";
import type { OfficeDocument } from "../../lib/office/types";
import { useViewport } from "../../lib/viewport";
import { Chevron } from "../shell/Chevron";

const IS_WEB = typeof document !== "undefined";
const STORAGE_KEY = "bcp:office-toc-collapsed";

function readCollapsed(): boolean {
  if (!IS_WEB) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean): void {
  if (!IS_WEB) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore storage failures
  }
}

function sectionLabel(key: OfficeSectionKey, heading: string | null): string {
  if (heading) return heading;
  switch (key) {
    case "opening":
      return "Opening Sentence";
    case "confession":
      return "Confession of Sin";
    case "invitatory":
      return "Invitatory and Psalter";
    case "lessons":
      return "The Lessons";
    case "creed":
      return "The Apostles' Creed";
    case "prayers":
      return "The Prayers";
    case "suffrages-a":
    case "suffrages-b":
      return "Suffrages";
    default:
      return key;
  }
}

export function officeSectionId(key: OfficeSectionKey): string {
  return `office-section-${key}`;
}

type TocItem = { key: OfficeSectionKey; label: string; id: string };

function buildItems(document: OfficeDocument): TocItem[] {
  const items: TocItem[] = [];
  let sawSuffrages = false;
  for (const section of document.sections) {
    if (section.nodes.length === 0) continue;
    if (section.key === "suffrages-a" || section.key === "suffrages-b") {
      if (sawSuffrages) continue;
      sawSuffrages = true;
      items.push({
        key: section.key,
        label: "Suffrages",
        id: officeSectionId(section.key),
      });
      continue;
    }
    items.push({
      key: section.key,
      label: sectionLabel(section.key, section.heading),
      id: officeSectionId(section.key),
    });
  }
  return items;
}

export function OfficeToc({ document }: { document: OfficeDocument }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const isClickScrolling = useRef(false);
  const scrollFrame = useRef<number | null>(null);
  const pickActiveRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    writeCollapsed(collapsed);
  }, [collapsed]);

  const items = useMemo(() => buildItems(document), [document]);

  useEffect(() => {
    if (!IS_WEB || collapsed || items.length === 0) return;
    const ids = items.map((i) => i.id);
    const activationOffset = 120;
    let raf = 0;

    const pickActive = () => {
      raf = 0;
      if (isClickScrolling.current) return;
      let current = ids[0] ?? null;
      for (const id of ids) {
        const el = window.document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= activationOffset) current = id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };
    pickActiveRef.current = pickActive;

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(pickActive);
    };

    // listen in capture phase so inner scroll containers also trigger updates
    window.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", onScroll);
    pickActive();

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      if (scrollFrame.current) window.cancelAnimationFrame(scrollFrame.current);
      pickActiveRef.current = () => undefined;
    };
  }, [items, collapsed]);

  const unlockScroll = () => {
    if (!isClickScrolling.current) return;
    isClickScrolling.current = false;
    if (scrollFrame.current) {
      window.cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = null;
    }
    pickActiveRef.current();
  };

  const handleClick =
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = window.document.getElementById(id);
      if (!el) return;
      isClickScrolling.current = true;
      setActiveId(id);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);

      if (scrollFrame.current) window.cancelAnimationFrame(scrollFrame.current);

      const cancelOnUserInput = () => unlockScroll();
      window.addEventListener("wheel", cancelOnUserInput, {
        passive: true,
        once: true,
      });
      window.addEventListener("touchmove", cancelOnUserInput, {
        passive: true,
        once: true,
      });

      const start = performance.now();
      let lastY = window.scrollY;
      let stillFrames = 0;
      const tick = () => {
        if (!isClickScrolling.current) {
          scrollFrame.current = null;
          return;
        }
        const target = window.document.getElementById(id);
        const y = window.scrollY;
        const moved = Math.abs(y - lastY);
        lastY = y;
        const targetTop = target?.getBoundingClientRect().top ?? 0;
        if (moved < 0.5) stillFrames += 1;
        else stillFrames = 0;
        const settled = stillFrames >= 6 && Math.abs(targetTop) < 160;
        const timedOut = performance.now() - start > 2000;
        if (settled || timedOut) {
          window.removeEventListener("wheel", cancelOnUserInput);
          window.removeEventListener("touchmove", cancelOnUserInput);
          unlockScroll();
          return;
        }
        scrollFrame.current = window.requestAnimationFrame(tick);
      };
      scrollFrame.current = window.requestAnimationFrame(tick);
    };

  if (!IS_WEB || items.length < 2) return null;

  return (
    <nav aria-label="Sections" style={{ width: 180 }}>
      <button
        type="button"
        aria-label={collapsed ? "Show sections" : "Hide sections"}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((v) => !v)}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: "4px 6px 4px 18px",
          margin: "0 0 8px -6px",
          border: "none",
          borderRadius: 4,
          background: "transparent",
          color: "var(--text-secondary)",
          cursor: "pointer",
          font: "600 12px/1.2 var(--ui-font, system-ui, sans-serif)",
          letterSpacing: "0.08em",
          fontVariantCaps: "all-small-caps",
          transition: "color 0.2s ease",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            // rail is at left: 6px, width: 2px -> center at 7px; center chevron on it
            left: 7,
            top: "50%",
            transform: "translate(-50%, -50%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 12,
            height: 12,
          }}
        >
          <Chevron
            direction={collapsed ? "right" : "down"}
            size={6}
            stroke={1.5}
          />
        </span>
        <span>SECTIONS</span>
      </button>
      {!collapsed ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.map((item) => {
            const active = item.id === activeId;
            const hovered = hoveredId === item.id;
            return (
              <a
                key={item.key}
                href={`#${item.id}`}
                onClick={handleClick(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() =>
                  setHoveredId((current) =>
                    current === item.id ? null : current,
                  )
                }
                style={{
                  position: "relative",
                  display: "block",
                  padding: "5px 6px 5px 18px",
                  marginLeft: -6,
                  color: active
                    ? "var(--accent)"
                    : hovered
                      ? "var(--text)"
                      : "var(--text-secondary)",
                  textDecoration: "none",
                  font: "500 12px/1.35 var(--ui-font, system-ui, sans-serif)",
                  transition: "color 0.2s ease",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 6,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: active ? "var(--accent)" : "var(--border)",
                    transition: "background-color 0.2s ease",
                  }}
                />
                <span style={{ display: "block", minWidth: 0 }}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}

// temporarily disabled; the TOC and its setting stay in place for now
const SECTIONS_DISABLED = true;

// coarse visibility gate: desktop/wide screens with enough room for office + gutter
export function useOfficeTocVisible(
  isDailyOffice: boolean,
  enabled = true,
): boolean {
  const viewport = useViewport();
  const { fontScale } = useTheme();
  if (SECTIONS_DISABLED || !IS_WEB || !isDailyOffice || !enabled) return false;
  const contentWidth = 736 * Math.max(fontScale, 1);
  // office column plus comfortable side gutters for a TOC rail
  return viewport.width >= contentWidth + 480;
}
