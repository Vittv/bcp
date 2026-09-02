import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useNavigation } from "../../context/NavigationContext";
import { sanctoraleBySlug } from "../../lib/calendar/sanctorale";
import { CHROME_FONT, HEADING_FONT } from "../../lib/fonts";
import { useReference } from "../../screens/reference/shared";
import { AppModal } from "../shell/AppModal";
import { SanctoraleCard } from "./SanctoraleCard";

// tapping a saint mention anywhere in an office opens a reusable modal
// window (the same chrome as Settings/About) holding the saint's bio, so
// the reader never leaves the prayer to look the saint up. the liturgy
// is left out here (bio-only) since the mention is a quick lookup, not
// the full reference page. appmodal handles the standard dismissals
// (Esc, backdrop, X). context lives at module scope so any office node
// can open it without prop drilling.
type SaintPopoverValue = {
  openSaint: (slug: string) => void;
  close: () => void;
};

const SaintPopoverContext = createContext<SaintPopoverValue | null>(null);

export function useSaintPopover(): SaintPopoverValue {
  const ctx = useContext(SaintPopoverContext);
  if (!ctx) throw new Error("useSaintPopover outside SaintPopoverProvider");
  return ctx;
}

export function SaintPopoverProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const { navigateTo } = useNavigation();
  const { setOpenSaint } = useReference();

  const openSaint = useCallback((s: string) => setSlug(s), []);
  const close = useCallback(() => setSlug(null), []);

  const openInSaints = () => {
    if (!slug) return;
    // the saints page opens the same saint through the pending-ref
    // handshake mirrored in BibleProvider
    setOpenSaint(slug);
    setSlug(null);
    navigateTo({ page: "saints" });
  };

  const entry = slug ? sanctoraleBySlug(slug) : undefined;

  return (
    <SaintPopoverContext.Provider value={{ openSaint, close }}>
      {children}
      {slug && entry ? (
        <AppModal
          title={entry.title}
          onClose={close}
          titleStyle={{
            fontFamily: HEADING_FONT,
            fontWeight: "700",
          }}
          footer={
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
          }
        >
          <SanctoraleCard slug={slug} showTitle={false} showLiturgy={false} />
        </AppModal>
      ) : null}
    </SaintPopoverContext.Provider>
  );
}

const styles = StyleSheet.create({
  saintsBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border, #c9c1b2)",
  },
  saintsBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  saintsBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "600",
    color: "var(--accent, #7a3040)",
  },
});
