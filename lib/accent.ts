import type { CSSProperties } from "react"

// Per-user accent palettes. Keys are stored in User.accentColor;
// "sky" is the default and matches the original design.
export const ACCENT_PALETTES: Record<string, { label: string; shades: Record<string, string> }> = {
  sky: {
    label: "Блакитний",
    shades: { 100: "#EBF5FD", 200: "#D5EAFB", 300: "#BED9F4", 500: "#5B9BD1", 600: "#3A7AA8", 700: "#2d618a", 900: "#1e3a52" },
  },
  mint: {
    label: "М'ятний",
    shades: { 100: "#E8FAF0", 200: "#D2F5E3", 300: "#B8EBD0", 500: "#4FBF8B", 600: "#2F9D6A", 700: "#26805A", 900: "#14532D" },
  },
  lavender: {
    label: "Лавандовий",
    shades: { 100: "#F3EFFD", 200: "#E7DFFA", 300: "#D4C5F4", 500: "#9B7FD4", 600: "#7C5DBF", 700: "#64499E", 900: "#3B2A63" },
  },
  rose: {
    label: "Рожевий",
    shades: { 100: "#FDEFF2", 200: "#FADFE6", 300: "#F4C2CF", 500: "#E17A96", 600: "#C4536F", 700: "#A03E58", 900: "#5C2333" },
  },
  peach: {
    label: "Персиковий",
    shades: { 100: "#FDF3E7", 200: "#FAE5CC", 300: "#F4D0A4", 500: "#E0A356", 600: "#C77F2B", 700: "#A36521", 900: "#5C3A12" },
  },
  teal: {
    label: "Бірюзовий",
    shades: { 100: "#E9F7F8", 200: "#D3EFF1", 300: "#B4E3E7", 500: "#55B7C0", 600: "#35939C", 700: "#2A767E", 900: "#173F44" },
  },
}

export const DEFAULT_ACCENT = "sky"

export function isValidAccent(key: unknown): key is string {
  return typeof key === "string" && key in ACCENT_PALETTES
}

// CSS variable overrides for a user's accent; empty object for the default
// so the :root values from globals.css apply untouched.
export function accentStyle(key?: string | null): CSSProperties {
  if (!key || key === DEFAULT_ACCENT || !(key in ACCENT_PALETTES)) return {}
  const shades = ACCENT_PALETTES[key].shades
  return Object.fromEntries(
    Object.entries(shades).map(([shade, color]) => [`--accent-${shade}`, color])
  ) as CSSProperties
}
