export const colors = {
  background: "#FFFFFF",
  surface: "#F4F6F8",
  text: "#0F1720",
  textMuted: "#5B6472",
  primary: "#1E6F5C",
  primaryText: "#FFFFFF",
  border: "#E2E6EA",
  danger: "#B3261E",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: "700" as const },
  subtitle: { fontSize: 16, fontWeight: "400" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  label: { fontSize: 13, fontWeight: "600" as const },
} as const;

export const radius = {
  sm: 6,
  md: 12,
} as const;
