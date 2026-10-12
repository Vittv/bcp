import type { CSSProperties, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import {
  type ChangelogBlock,
  type InlineNode,
  parseChangelogMarkdown,
  parseInline,
} from "../../lib/changelogMd";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";
import { ExternalLink } from "../ExternalLink";

// renders the release-notes grammar (sections, paragraphs, bullets and the
// trailing full-changelog link) as views sharing the app chrome. the notes
// carry no `# ` title line: the modal header shows the version, and a stray
// `# ` line parses as a title block that renders nothing. markdown is parsed
// once per render; sources are tiny release notes, so the cost is negligible.
const MONO = '"JetBrains Mono", monospace';

// inline spans render as nested <Text>, with links as real anchors so the
// desktop shell hands them to the system browser
function InlineText({ nodes }: { nodes: InlineNode[] }): ReactNode {
  const styles = useThemedStyles(markdownStyles);
  const v = useThemeVar();
  const linkStyle = { ...web.link, color: v("var(--accent)") };
  return nodes.map((node, index) => {
    switch (node.t) {
      case "text":
        // biome-ignore lint/suspicious/noArrayIndexKey: static spans, never reorder
        return <Text key={index}>{node.value}</Text>;
      case "bold":
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static spans, never reorder
          <Text key={index} style={styles.bold}>
            <InlineText nodes={node.children} />
          </Text>
        );
      case "code":
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static spans, never reorder
          <Text key={index} style={styles.code}>
            {node.value}
          </Text>
        );
      case "link":
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static spans, never reorder
          <ExternalLink key={index} href={node.href} style={linkStyle}>
            <InlineText nodes={node.children} />
          </ExternalLink>
        );
      default:
        return null;
    }
  });
}

function Paragraph({ text }: { text: string }) {
  const styles = useThemedStyles(markdownStyles);
  return (
    <Text style={styles.paragraph}>
      <InlineText nodes={parseInline(text)} />
    </Text>
  );
}

function Bullet({ text }: { text: string }) {
  const styles = useThemedStyles(markdownStyles);
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>•</Text>
      <Text style={styles.paragraph}>
        <InlineText nodes={parseInline(text)} />
      </Text>
    </View>
  );
}

function Block({ block }: { block: ChangelogBlock }) {
  const styles = useThemedStyles(markdownStyles);
  switch (block.t) {
    case "heading":
      return (
        <Text style={block.level === 2 ? styles.heading2 : styles.heading3}>
          <InlineText nodes={parseInline(block.text)} />
        </Text>
      );
    case "paragraph":
      return <Paragraph text={block.text} />;
    case "bullets":
      return (
        <View style={styles.bullets}>
          {block.items.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static bullets, never reorder
            <Bullet key={index} text={item} />
          ))}
        </View>
      );
    case "footer":
      return (
        <View style={styles.footer}>
          <Pressable
            onPress={() => window.open(block.href, "_blank", "noreferrer")}
            style={({ hovered }) => [
              styles.footerLinkPad,
              hovered && styles.footerLinkHover,
            ]}
            accessibilityRole="link"
            accessibilityLabel={block.label}
          >
            <Text style={styles.footerLinkText}>{block.label}</Text>
          </Pressable>
        </View>
      );
    default:
      return null;
  }
}

export function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = parseChangelogMarkdown(markdown);
  return (
    <View>
      {blocks.map((block, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static note blocks, never reorder
        <Block key={index} block={block} />
      ))}
    </View>
  );
}

const markdownStyles = defineThemedStyles({
  heading2: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 25,
    color: "var(--text)",
    marginTop: 12,
    marginBottom: 4,
  },
  heading3: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 21,
    color: "var(--text)",
    marginTop: 10,
    marginBottom: 3,
  },
  paragraph: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    lineHeight: 23,
    color: "var(--text-secondary)",
    marginBottom: 10,
  },
  bullets: {
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  bulletMark: {
    fontFamily: CHROME_FONT,
    fontSize: 15,
    lineHeight: 23,
    color: "var(--accent)",
  },
  // inline spans inside a paragraph keep the surrounding face unless asked
  // to differ, so bold only bumps the weight and code only swaps the face
  bold: {
    fontWeight: "700",
    color: "var(--text)",
  },
  code: {
    fontFamily: MONO,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--accent)",
  },
  footer: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
  },
  footerLinkPad: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginHorizontal: -4,
  },
  footerLinkHover: {
    backgroundColor: "var(--control-hover)",
  },
  footerLinkText: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 13,
    color: "var(--accent)",
    textDecorationLine: "underline",
  },
});

// the anchor carries real css colors (react-native-web renders <a>); the
// same accent underline the settings and about screens use for links. the
// footer changelog link is a plain pressable instead, opening the repository
// the same way the sidebar's Source button does
const web: Record<string, CSSProperties> = {
  link: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 13,
    textDecorationLine: "underline",
    wordBreak: "break-all",
  },
};
