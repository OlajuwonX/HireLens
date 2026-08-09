export type ThemeMode = "light" | "dark";

export type ColorRole =
  | "background"
  | "surface"
  | "surfaceSecondary"
  | "surfaceElevated"
  | "sidebar"
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "border"
  | "borderStrong"
  | "accent"
  | "accentHover"
  | "accentText"
  | "actionDark"
  | "actionDarkText"
  | "danger"
  | "warning"
  | "info";

export type Palette = Record<ColorRole, string>;

export const light: Palette = {
  background: "#F7F8F6",
  surface: "#FFFFFF",
  surfaceSecondary: "#F0F2EF",
  surfaceElevated: "#E9ECE8",
  sidebar: "#FFFFFF",
  textPrimary: "#161A18",
  textSecondary: "#646B67",
  textMuted: "#8B928E",
  border: "#DDE1DD",
  borderStrong: "#C8CEC9",
  accent: "#B8F34A",
  accentHover: "#A9E43C",
  accentText: "#142006",
  actionDark: "#161A18",
  actionDarkText: "#FFFFFF",
  danger: "#D94848",
  warning: "#D79B2E",
  info: "#4E7CBD",
};

export const dark: Palette = {
  background: "#111312",
  surface: "#1B1E1C",
  surfaceSecondary: "#222623",
  surfaceElevated: "#292E2A",
  sidebar: "#151816",
  textPrimary: "#F3F5F2",
  textSecondary: "#A7AEA9",
  textMuted: "#747B76",
  border: "#303530",
  borderStrong: "#404740",
  accent: "#C5F85A",
  accentHover: "#B5E94A",
  accentText: "#11180A",
  actionDark: "#F3F5F2",
  actionDarkText: "#11180A",
  danger: "#D94848",
  warning: "#D79B2E",
  info: "#4E7CBD",
};

export const palettes: Record<ThemeMode, Palette> = { light, dark };

export const accentSurfaces = [
  "primaryCta",
  "activeNavIndicator",
  "positiveScore",
  "progressState",
  "selectedControl",
  "chartHighlight",
] as const;

export type AccentSurface = (typeof accentSurfaces)[number];
