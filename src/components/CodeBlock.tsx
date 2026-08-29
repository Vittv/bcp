import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CHROME_FONT } from "../lib/fonts";

// Code blocks theme themselves through the app palette: the raised surface
// background and border read correctly in both light and dark, and the mono
// face is the bundled JetBrains Mono with a system fallback.
const MONO = '"JetBrains Mono", monospace';

type CodeBlockProps = {
  value: string;
  label?: string;
};

async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to the execCommand path
  }
  if (typeof document !== "undefined") {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
  }
  return false;
}

export function CodeBlock({ value, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <View style={styles.block}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <ScrollView
          horizontal
          style={styles.codeScroll}
          contentContainerStyle={styles.codeScrollContent}
          showsHorizontalScrollIndicator
        >
          <Text style={styles.code} selectable>
            {value}
          </Text>
        </ScrollView>
        <Pressable
          onPress={onCopy}
          accessibilityRole="button"
          accessibilityLabel="Copy command"
          style={({ hovered }) => [
            styles.copyBtn,
            copied && styles.copyBtnDone,
            hovered && styles.copyBtnHover,
          ]}
        >
          <Text style={[styles.copyText, copied && styles.copyTextDone]}>
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 8,
  },
  label: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 13,
    color: "var(--text-secondary, #6b6159)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "var(--bg-raised, #ece7dd)",
    borderWidth: 1,
    borderColor: "var(--border, #cbc5bb)",
    borderRadius: 4,
    paddingLeft: 10,
  },
  codeScroll: {
    flex: 1,
    overflow: "hidden",
  },
  codeScrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  code: {
    fontFamily: MONO,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text, #2c2020)",
    lineHeight: 24,
    paddingVertical: 8,
    userSelect: "text",
    flexShrink: 0,
  },
  copyBtn: {
    alignSelf: "stretch",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: "var(--border, #cbc5bb)",
    backgroundColor: "transparent",
    marginLeft: 6,
  },
  copyBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  copyBtnDone: {
    backgroundColor: "var(--today-bg, rgba(122, 48, 64, 0.16))",
  },
  copyText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--accent, #7a3040)",
    fontWeight: "600",
  },
  copyTextDone: {
    color: "var(--text, #2c2020)",
  },
});
