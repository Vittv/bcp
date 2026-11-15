import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { useThemedStyles, useThemeVar } from "../../../lib/theme/themedStyles";
import type { WindowActions } from "./actions";
import {
  CLOSE_GLYPH,
  MAC_CLOSE,
  MAC_CLOSE_BORDER,
  MAC_CLOSE_GLYPH,
  MAC_MAXIMIZE,
  MAC_MAXIMIZE_BORDER,
  MAC_MAXIMIZE_GLYPH,
  MAC_MINIMIZE,
  MAC_MINIMIZE_BORDER,
  MAC_MINIMIZE_GLYPH,
} from "./constants";
import {
  CloseGlyph,
  MacZoomGlyph,
  MaximizeGlyph,
  MinimizeGlyph,
  RestoreGlyph,
} from "./glyphs";
import { windowControlStyles } from "./styles";

// flat titlebar button: full-height, square edges, red close hover
function FlatControlButton({
  label,
  close = false,
  round = false,
  disabled,
  onPress,
  children,
}: {
  label: string;
  close?: boolean;
  round?: boolean;
  disabled: boolean;
  onPress: () => void;
  children: (color: string) => ReactNode;
}) {
  const styles = useThemedStyles(windowControlStyles);
  const v = useThemeVar();
  const [hovered, setHovered] = useState(false);
  const color = close && hovered ? CLOSE_GLYPH : v("var(--text-secondary)");
  const base = round ? styles.roundButton : styles.flatButton;
  const hover = round
    ? close
      ? styles.roundCloseHover
      : styles.roundHover
    : close
      ? styles.flatCloseHover
      : styles.flatHover;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[base, hovered && hover]}
    >
      {children(color)}
    </Pressable>
  );
}

export function WindowsControls({ actions }: { actions: WindowActions }) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <View style={styles.flatRow}>
      <FlatControlButton
        label="Minimize"
        disabled={!actions.ready}
        onPress={actions.minimize}
      >
        {(color) => <MinimizeGlyph color={color} />}
      </FlatControlButton>
      <FlatControlButton
        label={actions.maximized ? "Restore" : "Maximize"}
        disabled={!actions.ready}
        onPress={actions.toggle}
      >
        {(color) =>
          actions.maximized ? (
            <RestoreGlyph color={color} />
          ) : (
            <MaximizeGlyph color={color} />
          )
        }
      </FlatControlButton>
      <FlatControlButton
        label="Close"
        close
        disabled={!actions.ready}
        onPress={actions.close}
      >
        {(color) => <CloseGlyph color={color} />}
      </FlatControlButton>
    </View>
  );
}

export function LinuxControls({ actions }: { actions: WindowActions }) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <View style={styles.roundRow}>
      <FlatControlButton
        label="Minimize"
        round
        disabled={!actions.ready}
        onPress={actions.minimize}
      >
        {(color) => <MinimizeGlyph color={color} width={9} />}
      </FlatControlButton>
      <FlatControlButton
        label={actions.maximized ? "Restore" : "Maximize"}
        round
        disabled={!actions.ready}
        onPress={actions.toggle}
      >
        {(color) =>
          actions.maximized ? (
            <RestoreGlyph color={color} size={9} />
          ) : (
            <MaximizeGlyph color={color} size={9} />
          )
        }
      </FlatControlButton>
      <FlatControlButton
        label="Close"
        close
        round
        disabled={!actions.ready}
        onPress={actions.close}
      >
        {(color) => <CloseGlyph color={color} size={9} />}
      </FlatControlButton>
    </View>
  );
}

function MacControlButton({
  label,
  color,
  borderColor,
  disabled,
  showGlyph,
  onHoverIn,
  onHoverOut,
  onPress,
  children,
}: {
  label: string;
  color: string;
  borderColor: string;
  disabled: boolean;
  showGlyph: boolean;
  onHoverIn: () => void;
  onHoverOut: () => void;
  onPress: () => void;
  children: ReactNode;
}) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => [
        styles.macButton,
        pressed && !disabled && styles.macButtonPressed,
      ]}
    >
      <View style={[styles.macLight, { backgroundColor: color, borderColor }]}>
        {showGlyph ? children : null}
      </View>
    </Pressable>
  );
}

export function MacControls({ actions }: { actions: WindowActions }) {
  const styles = useThemedStyles(windowControlStyles);
  // reveal all glyphs over the cluster; the short delay bridges gaps between buttons
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );
  const showGlyphs = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHovered(true);
  };
  const hideGlyphs = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setHovered(false);
      hideTimer.current = null;
    }, 60);
  };
  return (
    <View style={styles.macRow}>
      <MacControlButton
        label="Close"
        color={MAC_CLOSE}
        borderColor={MAC_CLOSE_BORDER}
        disabled={!actions.ready}
        showGlyph={hovered}
        onHoverIn={showGlyphs}
        onHoverOut={hideGlyphs}
        onPress={actions.close}
      >
        <CloseGlyph color={MAC_CLOSE_GLYPH} size={7} />
      </MacControlButton>
      <MacControlButton
        label="Minimize"
        color={MAC_MINIMIZE}
        borderColor={MAC_MINIMIZE_BORDER}
        disabled={!actions.ready}
        showGlyph={hovered}
        onHoverIn={showGlyphs}
        onHoverOut={hideGlyphs}
        onPress={actions.minimize}
      >
        <MinimizeGlyph color={MAC_MINIMIZE_GLYPH} width={7} />
      </MacControlButton>
      <MacControlButton
        label={actions.maximized ? "Restore" : "Maximize"}
        color={MAC_MAXIMIZE}
        borderColor={MAC_MAXIMIZE_BORDER}
        disabled={!actions.ready}
        showGlyph={hovered}
        onHoverIn={showGlyphs}
        onHoverOut={hideGlyphs}
        onPress={actions.toggle}
      >
        <MacZoomGlyph color={MAC_MAXIMIZE_GLYPH} size={7} />
      </MacControlButton>
    </View>
  );
}
