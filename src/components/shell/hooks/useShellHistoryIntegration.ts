import { type MutableRefObject, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import type { HistorySnapshot } from "../../../context/HistoryContext";
import type { CalendarDate } from "../../../lib/calendar/types";
import {
  createHistoryController,
  type HistoryController,
} from "../../../lib/navigation/history";
import type { SettingsSectionId } from "../../../lib/settings";
import { historyLayer, markHistoryStep } from "../model/shellUtils";
import type { ModalType, PageId } from "../Sidebar";

type TabId = "morning" | "noonday" | "evening" | "compline";

export function useShellHistoryIntegration(args: {
  page: PageId;
  setPage: (p: PageId) => void;
  date: CalendarDate;
  setDate: (d: CalendarDate) => void;
  tab: TabId;
  setTab: (t: TabId) => void;
  modal: ModalType | null;
  modalRef: MutableRefObject<ModalType | null>;
  setModal: (m: ModalType | null) => void;
  setSettingsSection: (s: SettingsSectionId | null) => void;
  mobileOpen: boolean;
  mobileOpenRef: MutableRefObject<boolean>;
  setMobileOpen: (v: boolean) => void;
  isMobile: boolean;
  setReading: (r: string | null) => void;
  scrollToTop: () => void;
}) {
  const {
    page,
    setPage,
    date,
    setDate,
    tab,
    setTab,
    modal,
    modalRef,
    setModal,
    setSettingsSection,
    mobileOpen,
    mobileOpenRef,
    setMobileOpen,
    setReading,
    scrollToTop,
  } = args;

  // browser history integration: one controller for the whole shell. only
  // web has a history to drive; native builds get a null (no-op) provider.
  const [historyController] =
    useState<HistoryController<HistorySnapshot> | null>(() => {
      if (Platform.OS !== "web") return null;
      return createHistoryController<HistorySnapshot>({
        addEventListener: (type, cb) => window.addEventListener(type, cb),
        removeEventListener: (type, cb) => window.removeEventListener(type, cb),
        history: window.history,
        seedUrl: window.location.href,
      });
    });

  // the controller's getters must read the latest committed value, not a
  // closure captured at registration time; these refs update each render
  const pageRef = useRef(page);
  pageRef.current = page;
  const dateRef = useRef(date);
  dateRef.current = date;
  const tabRef = useRef(tab);
  tabRef.current = tab;

  // web only: the JSON of the current top-of-history entry when it is the
  // drawer's own record (see the record effect below). kept so re-opening
  // the drawer without navigating in between never stacks another entry.
  const drawerRecord = useRef<string | null>(null);
  // web only: the modal's own recorded step, mirroring drawerRecord. the
  // modal records on open so Back pops an entry that closes just it, and a
  // UI dismiss (X, Esc, backdrop) consumes that step like the drawer does.
  const modalRecord = useRef<string | null>(null);
  // web only: true while our own history.back() consumes a closed layer's
  // phantom step, so that pop does not re-close the drawer kept open beneath
  // a dismissed modal
  const consumingStep = useRef(false);

  // web only: reify the drawer-opening as its own history step, so the
  // system back button has an entry to pop even at the app root (where back
  // would otherwise leave the PWA instead of hiding the drawer). the
  // existing onRestored handler closes the drawer as soon as that entry is
  // popped, and resets drawerRecord so a later open records again.
  useEffect(() => {
    if (!historyController || !mobileOpen) return;
    const top = JSON.stringify(window.history.state ?? null) ?? null;
    if (top === drawerRecord.current) return;
    historyController.record();
    drawerRecord.current = markHistoryStep("drawer");
  }, [mobileOpen, historyController]);

  // reify the modal-open as its own history step, exactly like the drawer:
  // it records on top of the drawer's step when both are open, so Back pops
  // the modal's step first and close-the-modal takes priority over
  // close-the-drawer instead of leaving the PWA or stepping the page
  useEffect(() => {
    if (!historyController || !modal) return;
    const top = JSON.stringify(window.history.state ?? null) ?? null;
    if (top === modalRecord.current) return;
    historyController.record();
    modalRecord.current = markHistoryStep("modal");
  }, [modal, historyController]);

  // whenever the drawer closes while its recorded step is still the top of
  // history, consume that step via history.back() so Back behaves exactly as
  // if the drawer never opened. a dismiss (swipe, backdrop, hide button) only
  // hides the drawer, leaving its step behind the phantom entry: popping it
  // here keeps Back from stopping on a phantom drawer step. a system Back
  // that already popped the step clears drawerRecord in onRestored first, so
  // this never double-consumes.
  useEffect(() => {
    if (mobileOpen) return;
    // a modal records its own step on top of the drawer's; both snapshot the
    // same app state, so popping here while the modal is open would consume
    // the modal's step and dismiss it. leave the drawer step for after it
    if (modal || modalRecord.current) return;
    if (!historyController || !drawerRecord.current) return;
    const top = JSON.stringify(window.history.state ?? null) ?? null;
    if (top !== drawerRecord.current) return;
    drawerRecord.current = null;
    window.history.back();
  }, [mobileOpen, modal, historyController]);

  // a UI dismiss of the modal (X, Esc, backdrop) consumes its recorded step
  // via history.back() the way the drawer-close path does, so Back never
  // stops on a phantom modal entry. consumingStep tells the resulting pop
  // that this is our own consumption, so the drawer below stays open.
  useEffect(() => {
    if (modal) return;
    if (!historyController || !modalRecord.current) return;
    const top = JSON.stringify(window.history.state ?? null) ?? null;
    if (top !== modalRecord.current) return;
    modalRecord.current = null;
    consumingStep.current = true;
    window.history.back();
  }, [modal, historyController]);

  useEffect(() => {
    if (!historyController) return;
    historyController.start();
    return () => historyController.stop();
  }, [historyController]);

  useEffect(() => {
    if (!historyController) return;
    const offPage = historyController.register(
      "page",
      () => pageRef.current,
      (v) => setPage(v),
    );
    const offDate = historyController.register(
      "date",
      () => dateRef.current,
      (v) => setDate(v),
    );
    const offTab = historyController.register(
      "tab",
      () => tabRef.current,
      (v) => setTab(v),
    );
    const offRestored = historyController.onRestored((_entry, changed) => {
      // a history navigation must never leave transient chrome open over a
      // different page: the mobile drawer closes, and any modal and office
      // reading clear. a pop that changes no snapshot field undoes a
      // transient step instead, so the reading and scroll stay put
      const consumed = consumingStep.current;
      consumingStep.current = false;
      if (!changed) {
        // the open modal owns the topmost transient step, so its pop closes
        // just the modal and leaves the drawer's step for the next Back,
        // which is the priority a phone Back grants the modal over the
        // sidebar. without a modal, a user Back closes the drawer; our own
        // consumption of a dismissed modal's phantom step changes nothing
        if (modalRef.current) {
          modalRecord.current = null;
          setModal(null);
          setSettingsSection(null);
          return;
        }
        if (consumed) {
          // a drawer auto-closed behind the modal can leave its step on top;
          // consume that too so one Back does not stop on the closed drawer
          if (!mobileOpenRef.current && historyLayer() === "drawer") {
            drawerRecord.current = null;
            window.history.back();
          }
          return;
        }
        if (mobileOpenRef.current) setMobileOpen(false);
        drawerRecord.current = null;
        return;
      }
      drawerRecord.current = null;
      modalRecord.current = null;
      setMobileOpen(false);
      setModal(null);
      setSettingsSection(null);
      setReading(null);
      scrollToTop();
    });
    return () => {
      offPage();
      offDate();
      offTab();
      offRestored();
    };
  }, [
    historyController,
    scrollToTop,
    setPage,
    setDate,
    setTab,
    setModal,
    setSettingsSection,
    setMobileOpen,
    setReading,
    modalRef,
    mobileOpenRef,
  ]);

  return historyController;
}
