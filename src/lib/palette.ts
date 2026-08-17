"use client";

import { useSyncExternalStore } from "react";

/** Fixed-order categorical slots. Never cycle/reassign per filter change. */
export const CATEGORICAL_LIGHT = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
] as const;

export const CATEGORICAL_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
] as const;

/** Sequential blue ramp, light -> dark, for heatmap magnitude encoding. */
export const SEQUENTIAL_BLUE = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef",
  "#6da7ec", "#5598e7", "#3987e5", "#2a78d6",
  "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
] as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const CHROME_LIGHT = {
  surface: "#fcfcfb",
  page: "#f9f9f7",
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  textMuted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
} as const;

export const CHROME_DARK = {
  surface: "#1a1a19",
  page: "#0d0d0d",
  textPrimary: "#ffffff",
  textSecondary: "#c3c2b7",
  textMuted: "#898781",
  gridline: "#2c2c2a",
  baseline: "#383835",
} as const;

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(DARK_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/** Tracks the viewer's actual color-scheme preference for chart JS colors. */
export function usePrefersDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useChartPalette() {
  const dark = usePrefersDark();
  return {
    categorical: dark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT,
    chrome: dark ? CHROME_DARK : CHROME_LIGHT,
  };
}
