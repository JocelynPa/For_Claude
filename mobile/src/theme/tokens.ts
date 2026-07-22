/**
 * Thème sombre unique (pas de mode clair) — l'app garde toujours cette
 * identité visuelle, dans l'esprit épuré de l'app Tesla officielle.
 */
export const colors = {
  background: "#000000",
  surface: "#161618",
  surfaceElevated: "#232326",
  border: "#2f2f33",

  textPrimary: "#ffffff",
  textSecondary: "#8e8e93",
  textTertiary: "#5c5c60",

  accent: "#E82127",
  accentMuted: "#3d1416",

  success: "#30d158",
  warning: "#ff9f0a",
  danger: "#ff453a",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  largeTitle: { fontSize: 32, fontWeight: "700" as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "500" as const },
  micro: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.4 },
};
