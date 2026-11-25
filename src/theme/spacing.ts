// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Pure layout tokens, free of React Native so the web app (../100kvadrata-web)
// can share them through its sync script, like palette.ts.

/** Padding, margins and gaps. Pick from here instead of a one-off number. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  /** Inputs, chips. */
  sm: 8,
  /** Tiles, cards. */
  md: 14,
  /** Sheets and panels. */
  lg: 24,
  /** Buttons, price pill, anything fully rounded. */
  pill: 999,
} as const;

/**
 * Two shadow levels only. Spread one into a style together with
 * `shadowColor: colors.shadow`:
 * - `raised`: cards and tiles resting on the page;
 * - `floating`: sheets, the top bar and anything over the content.
 *
 * Stacking order (which view draws on top) is zIndex's job, not this one's.
 */
export const elevation = {
  raised: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  floating: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;
