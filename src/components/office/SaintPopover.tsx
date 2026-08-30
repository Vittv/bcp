import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "../../context/NavigationContext";
import { CHROME_FONT } from "../../lib/fonts";
import { useReference } from "../../screens/reference/shared";
import { SanctoraleCard } from "./SanctoraleCard";

// tapping a saint mention anywhere in an office renders this popover
// next to the tap (web) or as a centered sheet (native). context lives at
// module scope so any office node can open it without prop drilling.
type SaintPopoverState = {
  slug: string;
  x: number | null;
  y: number | null;
};

type SaintPopoverValue = {
  openSaint: (slug: string, x: number, y: number) => void;
  close: () => void;
};

const SaintPopoverContext = createContext<SaintPopoverValue | null>(null);

export function useSaintPopover(): SaintPopoverValue {
  const ctx = useContext(SaintPopoverContext);
  if (!ctx) throw new Error("useSaintPopover outside SaintPopoverProvider");
  return ctx;
}

export const IS_WEB = Platform.OS === "web";

// keep the card on screen: clamp within the viewport, letting the card
// scroll internally if it is taller than the space below the tap
function clampPoint(value: number, limit: number): number {
  if (!IS_WEB || Number.isNaN(value)) return 0;
  return Math.max(12, Math.min(value, limit));
}

export function SaintPopoverProvider({ children }: { children: ReactNode }) {
  const [popover, setPopover] = useState<SaintPopoverState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openSaint = useCallback((slug: string, x: number, y: number) => {
    if (IS_WEB) {
      setPopover({
        slug,
        x: clampPoint(x, window.innerWidth - 352),
        y: clampPoint(y, window.innerHeight - 90),
      });
    } else {
      setPopover({ slug, x: null, y: null });
    }
  }, []);

  const close = useCallback(() => setPopover(null), []);

  // Escape dismisses, and re-opening the calendar week or navigating away
  // should never strand an open popover
  useEffect(() => {
    if (!popover) return;
    if (!IS_WEB) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [popover, close]);

  const value: SaintPopoverValue = { openSaint, close };

  return (
    <SaintPopoverContext.Provider value={value}>
      {children}
      {popover ? (
        <PopoverContent
          slug={popover.slug}
          x={popover.x ?? 0}
          y={popover.y ?? 0}
          onClose={close}
          scrollRef={scrollRef}
        />
      ) : null}
    </SaintPopoverContext.Provider>
  );
}

function PopoverContent({
  slug,
  x,
  y,
  onClose,
  scrollRef,
}: {
  slug: string;
  x: number;
  y: number;
  onClose: () => void;
  scrollRef: React.Ref<HTMLDivElement>;
}) {
  const { navigateTo } = useNavigation();
  const { setOpenSaint } = useReference();

  const openInSaints = () => {
    // the saints page opens the same saint through the pending-ref
    // handshake mirrored in BibleProvider
    setOpenSaint(slug);
    onClose();
    navigateTo({ page: "saints" });
  };

  const cardStyle = IS_WEB
    ? [styles.cardWeb, { left: x, top: y }]
    : [styles.cardNative];

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Dismiss saint"
        accessibilityRole="button"
      />
      <View style={cardStyle}>
        {IS_WEB ? (
          <div ref={scrollRef} style={WEB_SCROLL}>
            <SanctoraleCard slug={slug} compact />
            <View style={styles.footer}>
              <Pressable
                style={({ hovered }) => [
                  styles.saintsBtn,
                  hovered && styles.saintsBtnHover,
                ]}
                onPress={openInSaints}
                accessibilityRole="button"
              >
                <Text style={styles.saintsBtnText}>Open in Saints</Text>
              </Pressable>
            </View>
          </div>
        ) : (
          <ScrollView style={styles.nativeScroll}>
            <SanctoraleCard slug={slug} compact />
            <View style={styles.footer}>
              <Pressable
                style={styles.saintsBtn}
                onPress={openInSaints}
                accessibilityRole="button"
              >
                <Text style={styles.saintsBtnText}>Open in Saints</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const WEB_SCROLL: React.CSSProperties = {
  maxHeight: "calc(100vh - 108px)",
  overflowY: "auto",
  width: 340,
  boxSizing: "border-box",
};

const styles = StyleSheet.create({
  overlay: IS_WEB
    ? {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }
    : {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 15, 15, 0.25)",
    zIndex: 1,
  },
  cardWeb: {
    position: "fixed" as const,
    zIndex: 2,
    width: 340,
    backgroundColor: "var(--bg-raised, #ece7dd)",
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardNative: {
    position: "absolute" as const,
    zIndex: 2,
    left: 20,
    right: 20,
    top: 80,
    maxHeight: "70%",
    backgroundColor: "var(--bg-raised, #ece7dd)",
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  nativeScroll: {
    maxHeight: "70%",
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  saintsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
  },
  saintsBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  saintsBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    color: "var(--accent, #7a3040)",
  },
});
