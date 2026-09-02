/** Hex mirrors of the CSS custom properties in tokens.css, for Chart.js which needs literal color strings. */
export const COLORS = {
  teal: "#2E7D6B",
  tealDark: "#1F5A4D",
  gold: "#E3A93C",
  goldDark: "#8A5C0F",
  purple: "#6C5FBC",
  slateMuted: "#B4B2A9",
} as const;

export function actionColor(action: "Increase" | "Reduce" | "Maintain"): string {
  if (action === "Increase") return COLORS.gold;
  if (action === "Reduce") return COLORS.teal;
  return COLORS.slateMuted;
}

/**
 * One-hue sequential ramp (light -> dark) anchored to the brand teal, for magnitude
 * encodings (heatmap cells) rather than series identity. Step 400/500 are the
 * existing --teal / --teal-dark tokens so the ramp reads as "the app's teal, deepening".
 */
export const SEQUENTIAL_TEAL = ["#E3F1EC", "#BFE0D4", "#8FC7B3", "#5CA98F", COLORS.teal, COLORS.tealDark, "#123A31"] as const;

export function sequentialTealColor(value: number, min: number, max: number): string {
  if (max <= min) return SEQUENTIAL_TEAL[0];
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const idx = Math.round(t * (SEQUENTIAL_TEAL.length - 1));
  return SEQUENTIAL_TEAL[idx];
}

/** Picks readable ink for text placed inside a colored fill, per the fill's luminance. */
export function readableInkOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1B3A4B" : "#FFFFFF";
}
