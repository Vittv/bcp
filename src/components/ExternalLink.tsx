import {
  type CSSProperties,
  createElement,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { IS_TAURI } from "../lib/desktop";
import { openExternal } from "../lib/openExternal";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
};

// native shells intercept the click because their webview cannot open new windows
export function ExternalLink({ href, children, style }: ExternalLinkProps) {
  return createElement(
    "a",
    {
      href,
      target: "_blank",
      rel: "noreferrer",
      "data-external-link": "",
      style,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        if (IS_TAURI || Platform.OS !== "web") {
          event.preventDefault();
          openExternal(href);
        }
      },
    },
    children,
  );
}
