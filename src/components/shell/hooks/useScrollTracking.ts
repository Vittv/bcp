import { useCallback, useEffect, useRef, useState } from "react";

import { IS_WEB } from "../model/shellUtils";

export function useScrollTracking() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const [scrollPct, setScrollPct] = useState(0);

  // shared sink for scroll progress: the outer document scroller reports
  // through handleScroll; the offices page's inner ScrollView reports
  // straight here, since its scrolling never touches the outer element
  const reportScroll = useCallback((pct: number) => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      setScrollPct(pct);
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      setScrollPct(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
    });
  }, []);

  const scrollToTop = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = 0;
      el.focus({ preventScroll: true });
    }
    setScrollPct(0);
    // also reset the SplitPane detail pane scroll (desktop reference pages)
    requestAnimationFrame(() => {
      // SAFETY: querySelector returns Element, we need HTMLElement for scrollTop
      const detail = window.document.querySelector(
        "[data-split-detail]",
      ) as HTMLElement | null;
      if (detail) detail.scrollTop = 0;
    });
  }, []);

  // park keyboard focus on the scroller so native arrow/space
  // navigation works from first load without a click
  useEffect(() => {
    if (!IS_WEB) return;
    scrollRef.current?.focus({ preventScroll: true });
  }, []);

  return {
    scrollRef,
    scrollPct,
    setScrollPct,
    reportScroll,
    handleScroll,
    scrollToTop,
  };
}
