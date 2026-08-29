import { type CSSProperties, createElement } from "react";

// Hand-rolled inline SVG icons (disc/feishin-style outline strokes). The app
// ships as web/PWA and the Tauri webview, both of which render to a real DOM,
// so we build real <svg> elements with createElement (same pattern as
// ExternalLink) and inherit color via currentColor; pass a `color` prop to
// override (e.g. for hover states).
//
// Crispness: each icon is rasterized on a 2x canvas (size*2) and scaled down
// to `size` CSS pixels, so the browser supersamples the strokes and they read
// as clean, sharp lines instead of soft blurred one. Stroke weight defaults to
// 2 for a confident outline at chrome sizes.

type IconProps = {
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
};

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

export function DownloadIcon({
  size = 16,
  strokeWidth = 2,
  color,
  style,
}: IconProps) {
  return icon(
    size,
    strokeWidth,
    color,
    style,
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </>,
  );
}

export function SettingsIcon({
  size = 16,
  strokeWidth = 2,
  color,
  style,
}: IconProps) {
  return icon(
    size,
    strokeWidth,
    color,
    style,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>,
  );
}

export function SunIcon({
  size = 16,
  strokeWidth = 2,
  color,
  style,
}: IconProps) {
  return icon(
    size,
    strokeWidth,
    color,
    style,
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
    </>,
  );
}

export function MoonIcon({
  size = 16,
  strokeWidth = 2,
  color,
  style,
}: IconProps) {
  return icon(
    size,
    strokeWidth,
    color,
    style,
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  );
}

export function SystemIcon({
  size = 16,
  strokeWidth = 2,
  color,
  style,
}: IconProps) {
  return icon(
    size,
    strokeWidth,
    color,
    style,
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M9 19.5h6M12 16.5v3" />
    </>,
  );
}

export function InfoIcon({
  size = 16,
  strokeWidth = 2,
  color,
  style,
}: IconProps) {
  return icon(
    size,
    strokeWidth,
    color,
    style,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7.5v.5" />
    </>,
  );
}

export function CloseIcon({
  size = 16,
  strokeWidth = 2,
  color,
  style,
}: IconProps) {
  return icon(
    size,
    strokeWidth,
    color,
    style,
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>,
  );
}

export function HelpIcon({
  size = 16,
  strokeWidth = 2,
  color,
  style,
}: IconProps) {
  return icon(
    size,
    strokeWidth,
    color,
    style,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9a2.9 2.9 0 1 1 4.4 2.5c-1.2.8-1.7 1.3-1.7 2.5" />
      <path d="M12 17.2v.1" />
    </>,
  );
}
