import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { BackHandler, Platform } from "react-native";
import { IS_WEB } from "../model/shellUtils";
import type { ModalType } from "../Sidebar";
import { useDrawerSwipe } from "../useDrawerSwipe";

export function useDrawerLayer(args: {
  isMobile: boolean;
  modal: ModalType | null;
  viewportWidth: number;
}) {
  const { isMobile, modal, viewportWidth } = args;

  // Persistent sidebar visibility on desktop, deliberately toggled by the
  // user. The mobile drawer is a separate, transient state (mobileOpen) so a
  // shrink-to-mobile / auto-hide can never overwrite a deliberate desktop
  // choice.
  const [desktopVisible, setDesktopVisibleRaw] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sidebarVisible") !== "false";
  });
  const setDesktopVisible = useCallback((v: boolean) => {
    setDesktopVisibleRaw(v);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarVisible", String(v));
    }
  }, []);

  // Transient mobile drawer open/close state; deliberately not persisted.
  const [mobileOpen, setMobileOpen] = useState(false);
  // entering mobile closes the transient drawer (no persistence); the derived
  // sidebarVisible restores the desktop choice on the way back up
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);
  // true only while a drag tracks the finger. the live position is written
  // straight to the drawer node (a CSS variable) so a move never re-renders the
  // shell; only the start and end of a gesture touch React, and mobileOpen flips
  // once per commit, so history still records one step per open, not per move.
  const [draggingDrawer, setDraggingDrawer] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Effective visibility: on mobile the drawer rides its transient state; on
  // desktop it follows the persisted preference. Resizing back to desktop
  // therefore restores the user's deliberate desktop choice, while a hidden
  // choice stays hidden.
  const sidebarVisible = isMobile ? mobileOpen : desktopVisible;

  // web only: the mobile drawer rides a translate transform on a CSS variable,
  // so a drag can drive it without a React render. it settles to its rest edge
  // (closed = fully off-screen, open = flush left) here, and a drag suspends the
  // spring meanwhile. the reduce-motion media query above disables the spring.
  useLayoutEffect(() => {
    if (!IS_WEB || !isMobile) return;
    const el = drawerRef.current;
    if (!el || draggingDrawer) return;
    el.style.transition = "";
    el.style.setProperty("--bcp-drawer-x", mobileOpen ? "0%" : "-100%");
  }, [mobileOpen, draggingDrawer, isMobile]);

  // live drag position from the swipe glue: track the finger through the CSS
  // variable and suspend the spring; null hands the drawer back to its
  // committed state (the layout effect above then springs it home)
  const handleDrawerProgress = useCallback((progress: number | null) => {
    if (progress === null) {
      setDraggingDrawer(false);
      return;
    }
    const el = drawerRef.current;
    if (el) {
      el.style.transition = "none";
      el.style.setProperty("--bcp-drawer-x", `${(progress - 1) * 100}%`);
    }
    setDraggingDrawer(true);
  }, []);

  // labeled toolbar pills only where the pane has room: the desktop column
  // clamps to 200-340px, so at 25% width labels fit from ~1088px up; the
  // mobile drawer is full-width and native always labels
  const toolbarLabels =
    Platform.OS !== "web" ||
    isMobile ||
    Math.min(340, Math.max(200, viewportWidth * 0.25)) >= 272;

  const openSidebar = useCallback(() => {
    if (isMobile) setMobileOpen(true);
    else setDesktopVisible(true);
  }, [isMobile, setDesktopVisible]);

  const hideSidebar = useCallback(() => {
    if (isMobile) setMobileOpen(false);
    else setDesktopVisible(false);
  }, [isMobile, setDesktopVisible]);

  // mobile drawer drag: any horizontal drag opens or closes the drawer with
  // the edge following the finger, full-screen. a modal takes precedence over
  // the sheltered drawer, so a swipe over modal content never opens it.
  const swipeHandlers = useDrawerSwipe({
    enabled: isMobile && modal === null,
    open: mobileOpen,
    onOpen: () => setMobileOpen(true),
    onClose: () => setMobileOpen(false),
    onProgress: handleDrawerProgress,
  });

  // Android hardware back hides the mobile drawer before the OS ever gets a
  // chance to leave the app; modals claim their own handler (registered
  // later, so LIFO dispatch runs theirs first) and nothing here runs on the
  // desktop/web builds
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (mobileOpen) {
        setMobileOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [mobileOpen]);

  const mobileOpenRef = useRef(mobileOpen);
  mobileOpenRef.current = mobileOpen;

  return {
    desktopVisible,
    setDesktopVisible,
    mobileOpen,
    setMobileOpen,
    mobileOpenRef,
    draggingDrawer,
    drawerRef,
    sidebarVisible,
    toolbarLabels,
    openSidebar,
    hideSidebar,
    handleDrawerProgress,
    swipeHandlers,
  };
}
