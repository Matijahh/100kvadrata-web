// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Pure type tokens, free of React Native so the web app (../100kvadrata-web)
// can share them through its sync script, like palette.ts.
//
// Seven roles cover every piece of text in the app. A size that is not one of
// these is a bug: fold it into the nearest role instead of adding a new one.
// Nothing is smaller than `caption` (12).

/** The four font files loaded in the root layout (`useFonts`). */
export const fontFamily = {
  /** CalSans: prices, screen titles and headlines only. */
  display: "CalSans",
  regular: "NotoSansRegular",
  semiBold: "NotoSansSemiBold",
  light: "NotoSansLight",
} as const;

export type FontWeight = keyof typeof fontFamily;

export const fontSize = {
  caption: 12,
  label: 14,
  body: 16,
  title: 18,
  heading: 22,
  display: 28,
  price: 34,
} as const;

export type TextRole = keyof typeof fontSize;

export const lineHeight: Record<TextRole, number> = {
  caption: 16,
  label: 20,
  body: 22,
  title: 24,
  heading: 28,
  display: 34,
  price: 40,
};

/** The face each role uses unless a component asks for another weight. */
export const roleFontWeight: Record<TextRole, FontWeight> = {
  caption: "regular",
  label: "regular",
  body: "regular",
  title: "semiBold",
  heading: "display",
  display: "display",
  price: "display",
};

export const textStyle = (role: TextRole, weight: FontWeight = roleFontWeight[role]) => ({
  fontSize: fontSize[role],
  lineHeight: lineHeight[role],
  fontFamily: fontFamily[weight],
});

/**
 * The most a user's system font size may scale text on fixed-height chrome
 * (tab bar badge, pills, chips, buttons). Body text scales freely; chrome that
 * cannot grow would clip, so it stops here.
 */
export const CHROME_MAX_FONT_SCALE = 1.4;
