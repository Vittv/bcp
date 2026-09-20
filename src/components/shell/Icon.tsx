import { type CSSProperties, createElement } from "react";
import { GLYPHS } from "./icons.tabler.generated";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
};

// all icons are a vendored subset of @tabler/icons-react (MIT, 24x24 grid,
// 2px stroke) in icons.tabler.generated.ts; the whole pack would be ~8MB of
// dead code under Metro, so tools/icons/vendor-tabler.mjs picks the glyphs
// the app uses.

// inline svg builder: renders to a real DOM <svg> (the app is web/PWA plus
// the Tauri webview), inherits color via currentColor, and rasterizes at 2x
// then scales down to `size` px so strokes read sharp; stroke weight
// defaults to 2 for a confident outline at chrome sizes.
function icon(
  size: number,
  strokeWidth: number,
  color: string | undefined,
  style: CSSProperties | undefined,
  children: React.ReactNode,
): React.ReactElement {
  return createElement(
    "span",
    {
      style: {
        display: "inline-flex",
        color,
        ...style,
      },
    },
    createElement(
      "svg",
      {
        width: size * 2,
        height: size * 2,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        style: { width: size, height: size },
      },
      children,
    ),
  );
}

// one vendored tabler glyph under bcp's usual props, rendered through the
// same 2x supersampled svg as the hand-rolled icons
function tabler(name: string) {
  return function IconWrapper({
    size = 16,
    strokeWidth = 2,
    color,
    style,
  }: IconProps) {
    const glyphs = GLYPHS[name];
    if (!glyphs) {
      throw new Error(`unknown tabler glyph: ${name}`);
    }
    return icon(
      size,
      strokeWidth,
      color,
      style,
      glyphs.map(([tag, attrs], index) =>
        createElement(tag, { ...attrs, key: index }),
      ),
    );
  };
}

export const DownloadIcon = tabler("Download");
export const SettingsIcon = tabler("Settings");
export const SunIcon = tabler("Sun");
export const MoonIcon = tabler("Moon");
export const SystemIcon = tabler("DeviceDesktop");
export const BookIcon = tabler("Book");
export const BookmarkIcon = tabler("Bookmark");
export const BibleIcon = tabler("Bible");
export const DesktopIcon = tabler("DeviceLaptop");
export const InfoIcon = tabler("InfoCircle");
export const SidebarIcon = tabler("LayoutSidebar");
export const CloseIcon = tabler("X");
export const HelpIcon = tabler("Help");
export const GithubIcon = tabler("BrandGithub");
export const CopyIcon = tabler("Copy");
export const CheckIcon = tabler("Check");
export const ChevronLeftIcon = tabler("ChevronLeft");
export const ChevronRightIcon = tabler("ChevronRight");
export const MagnifierIcon = tabler("Search");
export const ListIcon = tabler("List");
export const CalendarIcon = tabler("Calendar");
export const ClockIcon = tabler("Clock");
export const MusicIcon = tabler("Music");
export const StarIcon = tabler("Star");
export const CrownIcon = tabler("Crown");
export const CrossIcon = tabler("Cross");
export const TypographyIcon = tabler("Typography");
