import { type MutableRefObject, useEffect } from "react";
import type { HistorySnapshot } from "../../../context/HistoryContext";
import {
  isPaletteActive,
  type PaletteScope,
} from "../../../context/PaletteContext";
import { addDays } from "../../../lib/calendar";
import type { CalendarDate } from "../../../lib/calendar/types";
import { stepPageSequence } from "../../../lib/input/sequenceNav";
import { activeScrollTarget } from "../../../lib/input/vim";
import { requestPalette } from "../../../lib/modalBridge";
import type { SettingsSectionId } from "../../../lib/settings";
import { dismissEscapeConsumers } from "../AppModal";
import type { HintHandle } from "../HintLayer";
import { IS_WEB } from "../model/shellUtils";
import type { ModalType, PageId } from "../Sidebar";

export function useShellKeyboard(args: {
  modal: ModalType | null;
  setModal: (m: ModalType | null) => void;
  setSettingsSection: (s: SettingsSectionId | null) => void;
  page: PageId;
  date: CalendarDate;
  setDate: (d: CalendarDate | ((d: CalendarDate) => CalendarDate)) => void;
  setLectionaryDate: (
    d: CalendarDate | ((d: CalendarDate) => CalendarDate),
  ) => void;
  goToPage: (p: PageId, extra?: Partial<HistorySnapshot>) => void;
  isMobile: boolean;
  mobileOpenRef: MutableRefObject<boolean>;
  setMobileOpen: (v: boolean) => void;
  scrollRef: MutableRefObject<HTMLDivElement | null>;
  hintsRef: MutableRefObject<HintHandle | null>;
}) {
  const {
    modal,
    setModal,
    setSettingsSection,
    page,
    date,
    setDate,
    setLectionaryDate,
    goToPage,
    isMobile,
    mobileOpenRef,
    setMobileOpen,
    scrollRef,
    hintsRef,
  } = args;

  // global keyboard shortcuts (vim-style). attached in the capture phase
  // so handled keys are stopped before browser extensions like Vimium can
  // grab them; unhandled keys pass through untouched.
  useEffect(() => {
    if (!IS_WEB) return;
    let goPending = false;
    let goTimer: ReturnType<typeof setTimeout> | null = null;
    // the page-to-picker map for Ctrl+/: opens the same scope the visible
    // bar would, so the hotkey lands on whichever section the user is on
    const SCOPE_FOR_PAGE: Partial<Record<PageId, PaletteScope>> = {
      psalms: "psalms",
      psalter: "psalter",
      canticles: "canticles",
      collects: "collects",
      saints: "saints",
      "lesser-feasts": "lesser-feasts",
      proverbs: "proverbs",
      "old-testament": "bible",
      "new-testament": "bible",
      apocrypha: "bible",
    };
    const isEditable = (el: EventTarget | null): boolean => {
      // SAFETY: DOM keydown targets are Elements or text nodes; a missing
      // tagName is treated as non-editable by the guard below
      const t = el as HTMLElement | null;
      if (!t?.tagName) return false;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      return t.isContentEditable === true;
    };
    // scroll the currently-focused scroller by a fraction of its height. a
    // negative factor scrolls up. j/k and d/u share this, differ only in step.
    const scrollByFraction = (factor: number) => {
      const el = activeScrollTarget(scrollRef.current);
      if (!el) return;
      // sign-preserving step: never stall at 0, and never flip direction
      const raw = Math.round(el.clientHeight * factor);
      const top = raw === 0 ? (factor > 0 ? 1 : -1) : raw;
      el.scrollBy({ top, behavior: "auto" });
    };
    const scrollActiveTop = () => {
      const el = activeScrollTarget(scrollRef.current);
      if (el) el.scrollTop = 0;
    };
    const scrollActiveBottom = () => {
      const el = activeScrollTarget(scrollRef.current);
      if (el) el.scrollTop = el.scrollHeight;
    };
    const stepDay = (delta: number) => {
      // on the lectionary, n/p steps its own date without touching the
      // office date; everywhere else n/p steps the office date and jumps
      // to Today
      if (page === "lectionary") {
        setLectionaryDate((d) => addDays(d, delta));
        return;
      }
      const next = addDays(date, delta);
      setDate(next);
      goToPage("today", { date: next });
    };
    const clearGo = () => {
      if (goTimer) clearTimeout(goTimer);
      goPending = false;
      goTimer = null;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          // escaping a text field (e.g. a picker search) closes any
          // AppModal-registered modal (the picker itself) and returns focus
          // to the page so keyboard users can step out without a mouse.
          // SAFETY: editable targets are DOM elements with a blur(), verified
          // by the same tagName check that drove isEditable
          const t = e.target as HTMLElement;
          if (typeof t.blur === "function") {
            dismissEscapeConsumers();
            t.blur();
          }
        }
        return;
      }
      // a floating picker is open: swallow everything but Escape so letters,
      // go-chords and j/k/p never navigate behind the modal window
      if (isPaletteActive()) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          dismissEscapeConsumers();
        }
        return;
      }
      if (modal) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          setModal(null);
          setSettingsSection(null);
        }
        return;
      }
      // "/" opens this page's own picker ("?" is shift+"/" and keeps its
      // help meaning); Ctrl+K / Cmd+K opens the global search palette.
      // both are guarded by the editable check above, so keys typed into
      // any search field still type
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const scope = SCOPE_FOR_PAGE[page];
        if (scope) {
          e.preventDefault();
          e.stopImmediatePropagation();
          requestPalette(scope);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopImmediatePropagation();
        requestPalette("search");
        return;
      }
      // while hint mode is open every key drives the hint layer
      const hint = hintsRef.current;
      if (hint?.isActive()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        hint.handleKey(e);
        return;
      }
      if (goPending) {
        const k = e.key.toLowerCase();
        if (k === "g") {
          e.preventDefault();
          e.stopImmediatePropagation();
          clearGo();
          scrollActiveTop();
          return;
        }
        clearGo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key;
      switch (key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "h":
        case "l": {
          // left/right and h/l walk the active page's sequence, not browser
          // history: right and l step forward, left and h backward. the
          // scripture pages step their index (psalm number or chapter list)
          // and the calendar steps its month; each page registers a stepper.
          const forward = key === "ArrowRight" || key === "l";
          if (stepPageSequence(page, forward ? 1 : -1)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            // the swap can leave focus parked somewhere non-scrollable (a
            // bible chapter step re-parks it on the outer scroller, which
            // stays hidden on reference pages); re-focus the real scroller
            // so the next down/up scrolls the new page without a click
            requestAnimationFrame(() => {
              activeScrollTarget(scrollRef.current)?.focus({
                preventScroll: true,
              });
            });
          }
          return;
        }
        // "/" is consumed by the picker chord above; "?" (US shift+"/")
        // alone opens help
        case "?":
          if (e.shiftKey) {
            e.preventDefault();
            e.stopImmediatePropagation();
            setModal("help");
          }
          clearGo();
          return;
        case "Escape":
          e.preventDefault();
          // any open modal (AppModal-registered, e.g. the saint lookup)
          // closes first; then the full-screen mobile drawer; the go-chord
          // state clears either way
          dismissEscapeConsumers();
          if (isMobile && mobileOpenRef.current) setMobileOpen(false);
          e.stopImmediatePropagation();
          clearGo();
          return;
        case "g":
          e.preventDefault();
          e.stopImmediatePropagation();
          clearGo();
          // the only latched chord left is "gg" for the top of the page; the
          // page-jump letters that shared this latch are gone, so any other
          // second key just cancels it
          goPending = true;
          goTimer = setTimeout(clearGo, 900);
          return;
        case "n":
          e.preventDefault();
          e.stopImmediatePropagation();
          stepDay(1);
          return;
        case "p":
          e.preventDefault();
          e.stopImmediatePropagation();
          stepDay(-1);
          return;
        case "j":
          // j/k always scroll the main content pane; the index pickers move
          // their cursor with ctrl+j/ctrl+k instead (see useIndexKeyboard)
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollByFraction(0.14);
          return;
        case "k":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollByFraction(-0.14);
          return;
        case "d":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollByFraction(0.5);
          return;
        case "u":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollByFraction(-0.5);
          return;
        case "G":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActiveBottom();
          return;
        case "f":
          e.preventDefault();
          e.stopImmediatePropagation();
          clearGo();
          hintsRef.current?.start();
          return;
        case "Home":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActiveTop();
          return;
        case "End":
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollActiveBottom();
          return;
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (goTimer) clearTimeout(goTimer);
    };
  }, [
    modal,
    page,
    date,
    goToPage,
    isMobile,
    setModal,
    setSettingsSection,
    setDate,
    setLectionaryDate,
    mobileOpenRef,
    setMobileOpen,
    scrollRef,
    hintsRef,
  ]);
}
