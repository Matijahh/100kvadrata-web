// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Pure colour tokens, free of React Native so the web app (../100kvadrata-web)
// can share them through its sync script. The theme hooks live in colors.ts.

export type ThemeColors = {
  primary: string;
  primarySoft: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  text: string;
  textOnPrimary: string;
  formLabel: string;
  textMuted: string;
  placeholder: string;
  border: string;
  divider: string;
  tabInactive: string;
  mediaPlaceholder: string;
  mediaPlaceholderText: string;
  onMedia: string;
  onMediaMuted: string;
  overlay: string;
  shadow: string;
  destructive: string;
  success: string;
  // Generated avatars for users without a photo (components/genericComponents/
  // Avatar). Same order in both themes: an avatar keeps the slot it was given
  // and only the colour in that slot changes with the theme.
  avatarPalette: readonly string[];
};

export const lightColors: ThemeColors = {
  primary: "#6E1515",
  primarySoft: "#A55A5A",
  surface: "#FFFFFF",
  surfaceMuted: "#F5F5F5",
  surfaceElevated: "#FFFFFF",
  text: "#161722",
  textOnPrimary: "#FFFFFF",
  formLabel: "#5A6270",
  textMuted: "#6B7280",
  placeholder: "#8B94A3",
  border: "#E5E7EB",
  divider: "#EFEFEF",
  tabInactive: "#ABABAB",
  mediaPlaceholder: "#D9D9D9",
  mediaPlaceholderText: "#5C5C5C",
  // Content layered over listing photos/video stays light in both themes —
  // the media behind it is arbitrary, not theme-driven.
  onMedia: "#FFFFFF",
  onMediaMuted: "#D9D9D9",
  overlay: "rgba(17, 17, 17, 0.18)",
  shadow: "#000000",
  destructive: "#D94B4B",
  success: "#2E9E5B",
  // burgundy, terracotta, sand, cream, slate, rose
  avatarPalette: ["#6E1515", "#B5562F", "#E2B49A", "#F3E6D8", "#3F4A5A", "#A55A5A"],
};

export const darkColors: ThemeColors = {
  primary: "#f0616d",
  primarySoft: "#f0b4b4",
  surface: "#181A1F",
  surfaceMuted: "#101217",
  surfaceElevated: "#20242B",
  text: "#F5F7FA",
  textOnPrimary: "#FFF5F5",
  formLabel: "#B4BCC9",
  textMuted: "#A4ACB8",
  placeholder: "#7E8796",
  border: "#2A2E36",
  divider: "#262A32",
  tabInactive: "#78808E",
  mediaPlaceholder: "#2A2F37",
  mediaPlaceholderText: "#A1A8B5",
  onMedia: "#FFFFFF",
  onMediaMuted: "#A4ACB8",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "#000000",
  destructive: "#FF8D8D",
  success: "#4ADE80",
  // Cream becomes a deep plum so a light-on-dark avatar still has a dark side.
  avatarPalette: ["#f0616d", "#E07A52", "#C9927A", "#3A2F33", "#8592A6", "#f0b4b4"],
};

export const getThemeColors = (scheme?: "light" | "dark" | null) => {
  return scheme === "dark" ? darkColors : lightColors;
};
