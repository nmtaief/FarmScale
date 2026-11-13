export * from "./tailwind.preset";

export const TOKENS = {
  colors: {
    forest: "#14291F",
    sage: "#F3F7F0",
    white: "#FFFFFF",
    gold: "#D9A21B",
    goldPressed: "#C28F13",
    goldText: "#7A5900",
    leaf: "#2F7D4F",
    water: "#2E7DA6",
    waterText: "#256B8F",
    heat: "#C2472D",
    muted: "#4B6357",
  },
  darkColors: {
    background: "#0C1812",
    surface: "#15281E",
    surfaceHover: "#1C3327",
    textPrimary: "#E8F0E4",
    textSecondary: "#9DB3A5",
    border: "#28402F",
    borderStrong: "#3D5F47",
    gold: "#E3B23C",
    goldPressed: "#C79828",
    goldText: "#E3B23C",
    leaf: "#5BB27B",
    water: "#5BB0D8",
    waterText: "#78C5EC",
    heat: "#E8735A",
  },
  spacing: {
    1: 4,
    2: 8,
    3: 16,
    4: 24,
    5: 40,
    6: 64,
    7: 96,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  touchTargetMin: 44,
} as const;

export type Theme = "light" | "dark";
export type SupportedLocale = "en" | "bn" | "ja";
