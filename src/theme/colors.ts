export type ColorScheme = "light" | "dark";

export type ThemeColors = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  placeholder: string;
  primary: string;
  primaryPressed: string;
  primaryText: string;
  primarySurface: string;
  success: string;
  successText: string;
  successSurface: string;
  danger: string;
  dangerText: string;
  dangerSurface: string;
  warning: string;
  warningText: string;
  warningSurface: string;
  info: string;
  infoText: string;
  infoSurface: string;
  overlay: string;
  iconMuted: string;
};

export const darkColors: ThemeColors = {
  background: "#121212",
  backgroundAlt: "#0F1115",
  surface: "#1E1E1E",
  surfaceElevated: "#1B1F26",
  surfaceHighlight: "#252B35",
  border: "#2B3039",
  borderStrong: "#3A4352",
  text: "#FFFFFF",
  textMuted: "#C3CAD5",
  textSubtle: "#8E9AAF",
  textInverse: "#121212",
  placeholder: "#687386",
  primary: "#2F6FED",
  primaryPressed: "#234D9C",
  primaryText: "#FFFFFF",
  primarySurface: "#1B2A47",
  success: "#23864B",
  successText: "#6EE7A8",
  successSurface: "#153C28",
  danger: "#B91C1C",
  dangerText: "#FCA5A5",
  dangerSurface: "#3A1620",
  warning: "#F4B740",
  warningText: "#FCE6A9",
  warningSurface: "#3D2D10",
  info: "#60A5FA",
  infoText: "#DCE8FF",
  infoSurface: "#1B2A47",
  overlay: "rgba(0,0,0,0.78)",
  iconMuted: "#8090A8",
};

export const lightColors: ThemeColors = {
  background: "#F7F8FA",
  backgroundAlt: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceHighlight: "#F1F4F8",
  border: "#E2E6EC",
  borderStrong: "#C7CDD6",
  text: "#15181F",
  textMuted: "#3D4350",
  textSubtle: "#6B7280",
  textInverse: "#FFFFFF",
  placeholder: "#9CA3AF",
  primary: "#2563EB",
  primaryPressed: "#1D4ED8",
  primaryText: "#FFFFFF",
  primarySurface: "#DBE7FF",
  success: "#15803D",
  successText: "#15803D",
  successSurface: "#DCFCE7",
  danger: "#B91C1C",
  dangerText: "#B91C1C",
  dangerSurface: "#FEE2E2",
  warning: "#B45309",
  warningText: "#92400E",
  warningSurface: "#FEF3C7",
  info: "#1D4ED8",
  infoText: "#1E3A8A",
  infoSurface: "#DBEAFE",
  overlay: "rgba(15,17,21,0.55)",
  iconMuted: "#6B7280",
};

export const palettes: Record<ColorScheme, ThemeColors> = {
  dark: darkColors,
  light: lightColors,
};
