import { type CSSProperties, createElement, type ReactNode } from "react";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
};

// react-native-web renders a real anchor when a Text carries an href, and the
// desktop shell (Tauri webview) opens it in the system browser. Rendering the
// anchor directly keeps the external-link behavior explicit and avoids the
// RN types that do not expose an href on Text.
export function ExternalLink({ href, children, style }: ExternalLinkProps) {
  return createElement(
    "a",
    {
      href,
      target: "_blank",
      rel: "noreferrer",
      style,
    },
    children,
  );
}
