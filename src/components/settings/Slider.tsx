import { createElement, useEffect, useRef, useState } from "react";
import { PanResponder, Platform, Text, View } from "react-native";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";

// a plain accent ring: one knob silhouette across every slider, so the fill
// and the breakpoints carry the setting's character
function RoundThumb({ fill, stroke }: { fill: string; stroke: string }) {
  return createElement(
    "svg",
    {
      width: 18,
      height: 18,
      viewBox: "0 0 18 18",
      "aria-hidden": "true",
      style: { display: "block" },
    },
    createElement("circle", {
      cx: 9,
      cy: 9,
      r: 7,
      fill,
      stroke,
      strokeWidth: 2,
    }),
  );
}

type SliderProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  steps?: readonly number[];
  // render a ladder value as its tick label; the type ladder defaults to px
  formatTick?: (value: number) => string;
};

export function Slider({
  value,
  min = 0.85,
  max = 1.3,
  step = 0.01,
  onChange,
  steps,
  formatTick = (v) => `${v}px`,
}: SliderProps) {
  const styles = useThemedStyles(sliderStyles);
  const v = useThemeVar();
  const trackRef = useRef<View | null>(null);
  const [width, setWidth] = useState(0);
  const values = steps && steps.length > 0 ? steps : null;
  const thumbSize = 18;
  const pad = 9;

  const clamped = values
    ? values.reduce((prev, curr) =>
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
      )
    : Math.min(max, Math.max(min, value));

  const rangeMin = values ? Math.min(...values) : min;
  const rangeMax = values ? Math.max(...values) : max;
  const ratio = (clamped - rangeMin) / Math.max(1e-6, rangeMax - rangeMin);

  // the knob, the fill edge and the breakpoint lines must all land on the same
  // physical pixel column, or a hairline mark sits a half pixel off the knob's
  // center and reads as misaligned. snap every horizontal measure to the device
  // pixel grid, then center each mark on that shared column.
  const dpr =
    typeof window !== "undefined" && window.devicePixelRatio
      ? window.devicePixelRatio
      : 1;
  const snap = (px: number) => Math.round(px * dpr) / dpr;
  const valueX = snap(width * ratio);
  const thumbLeft = valueX - thumbSize / 2;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateFromX(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        updateFromX(evt.nativeEvent.pageX);
      },
    }),
  ).current;

  const trackX = useRef(0);
  const trackWidth = useRef(0);

  function updateFromX(pageX: number) {
    const x = pageX - trackX.current;
    const w = trackWidth.current;
    if (w <= 0) return;
    const pct = Math.min(1, Math.max(0, x / w));
    const raw = rangeMin + pct * (rangeMax - rangeMin);

    if (values) {
      const v = values.reduce((prev, curr) =>
        Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev,
      );
      onChange(v);
      return;
    }

    let v = raw;
    if (step > 0) {
      v = Math.round(v / step) * step;
    }
    onChange(v);
  }

  function measureTrack() {
    const node = trackRef.current;
    if (!node) return;
    // on web, CSS zoom leaves measure()'s offset geometry unscaled while
    // pageX arrives zoomed, so read the rect for hit math and offsetWidth for
    // the rendered width
    if (Platform.OS === "web") {
      // SAFETY: react-native-web renders View as a DOM element, so the ref is
      // the track node on web
      const el = node instanceof HTMLElement ? node : null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        trackWidth.current = rect.width;
        setWidth(el.offsetWidth);
      }
      trackX.current = rect.left + window.scrollX;
      return;
    }
    node.measure((_x, _y, w, _h, pageX) => {
      if (w > 0) {
        trackWidth.current = w;
        setWidth(w);
      }
      if (pageX !== undefined) {
        trackX.current = pageX;
      }
    });
  }

  useEffect(() => {
    measureTrack();
  });

  return (
    <View
      style={[styles.container, { paddingHorizontal: pad }]}
      onLayout={() => {
        measureTrack();
      }}
    >
      <View
        ref={trackRef}
        style={styles.track}
        pointerEvents="box-only"
        collapsable={false}
      >
        <View style={[styles.fill, { width: Math.max(0, valueX) }]} />
        <View
          style={[
            styles.thumb,
            {
              left: thumbLeft,
            },
          ]}
        >
          <RoundThumb fill={v("var(--bg)")} stroke={v("var(--accent)")} />
        </View>
        {values ? (
          <View style={styles.ticks}>
            {values.map((v) => {
              const r = (v - rangeMin) / Math.max(1e-6, rangeMax - rangeMin);
              // an even-width mark centered on the snapped column, so its
              // center is a whole pixel and lands under the knob's center (a 1px
              // hairline would center on a half pixel and sit 0.5px off)
              const left = snap(width * r) - 1;
              return <View key={v} style={[styles.tick, { left }]} />;
            })}
          </View>
        ) : null}
      </View>
      {/* a clear hit layer over the track and the thumb's overhang (the track
          itself is only 4px), so the whole control is draggable and carries
          the horizontal-resize cursor */}
      <View
        style={styles.hitArea}
        dataSet={{ bcpSlider: "" }}
        pointerEvents="box-only"
        {...panResponder.panHandlers}
      />
      {values ? (
        <View style={[styles.tickLabels, { left: pad, right: pad }]}>
          {values.map((v) => {
            const r = (v - rangeMin) / Math.max(1e-6, rangeMax - rangeMin);
            // centered on its tick, so the end labels sit on the track edges;
            // the pane padding absorbs the half-label overhang
            const left = snap(width * r) - 20;
            return (
              <Text key={v} style={[styles.tickLabel, { left }]}>
                {formatTick(v)}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const sliderStyles = defineThemedStyles({
  container: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    position: "relative",
  },
  track: {
    height: 4,
    backgroundColor: "var(--border)",
    borderRadius: 2,
    position: "relative",
  },
  // the knob overhangs the 4px track, so the hit layer spans the whole control
  // and carries the horizontal-resize cursor
  hitArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -18,
    height: 40,
    zIndex: 5,
  },
  fill: {
    height: 4,
    backgroundColor: "var(--accent)",
    opacity: 0.55,
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 0,
  },
  thumb: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    top: -7,
    zIndex: 10,
  },
  ticks: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    height: 24,
  },
  tick: {
    position: "absolute",
    top: 0,
    width: 2,
    height: 24,
    backgroundColor: "var(--text-secondary)",
    opacity: 0.4,
  },
  tickLabels: {
    position: "absolute",
    top: -28,
    height: 16,
  },
  tickLabel: {
    position: "absolute",
    top: 0,
    width: 40,
    fontFamily: CHROME_FONT,
    fontSize: 11,
    color: "var(--text-secondary)",
    textAlign: "center",
  },
});
