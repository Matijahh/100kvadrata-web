// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import type { GrowthCharacter } from "@/types/types";

/**
 * Pixel art for the three team characters on the "Admin igra" screen.
 * Each sprite is a 16 × 20 grid drawn as SVG paths, one path per colour; the
 * app draws them with react-native-svg, the web with a plain <svg>. Fixed
 * colours in both themes, like a photo: the tile behind them doesn't change.
 */

export const GROWTH_SPRITE_WIDTH = 16;
export const GROWTH_SPRITE_HEIGHT = 20;

const INK = "#161722";
const CREAM = "#FAF6F1";
const RED = "#D94B4B";
const BURGUNDY = "#6E1515";

/** The tile colour the sprites are drawn on. */
export const GROWTH_SPRITE_TILE = "#A55A5A";

export type GrowthSpriteLayer = { fill: string; d: string };

export const GROWTH_SPRITES: Record<GrowthCharacter, GrowthSpriteLayer[]> = {
  bard: [
    { fill: RED, d: "M7 0h2v1h-2zM4 4h8v1h-8zM7 15h2v1h-2z" },
    {
      fill: INK,
      d: "M5 1h6v1h-6zM4 2h1v1h-1zM11 2h1v1h-1zM3 3h1v1h-1zM12 3h1v1h-1zM3 4h1v1h-1zM12 4h1v1h-1zM3 5h1v1h-1zM12 5h1v1h-1zM3 6h1v1h-1zM5 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM3 7h1v1h-1zM12 7h1v1h-1zM3 8h1v1h-1zM6 8h1v1h-1zM9 8h1v1h-1zM12 8h1v1h-1zM3 9h1v1h-1zM7 9h2v1h-2zM12 9h1v1h-1zM4 10h1v1h-1zM11 10h1v1h-1zM5 11h6v1h-6zM4 12h1v1h-1zM11 12h1v1h-1zM3 13h1v1h-1zM5 13h6v1h-6zM12 13h1v1h-1zM2 14h1v1h-1zM4 14h3v1h-3zM9 14h3v1h-3zM13 14h1v1h-1zM2 15h1v1h-1zM4 15h2v1h-2zM10 15h2v1h-2zM13 15h1v1h-1zM3 16h4v1h-4zM9 16h4v1h-4zM4 17h1v1h-1zM11 17h1v1h-1zM5 18h1v1h-1zM7 18h2v1h-2zM10 18h1v1h-1zM4 19h4v1h-4zM9 19h4v1h-4z",
    },
    {
      fill: BURGUNDY,
      d: "M5 2h6v1h-6zM4 3h8v1h-8zM5 12h6v1h-6zM4 13h1v1h-1zM11 13h1v1h-1zM5 17h6v1h-6zM6 18h1v1h-1zM9 18h1v1h-1z",
    },
    {
      fill: CREAM,
      d: "M4 5h8v1h-8zM4 6h1v1h-1zM6 6h4v1h-4zM11 6h1v1h-1zM4 7h8v1h-8zM4 8h2v1h-2zM7 8h2v1h-2zM10 8h2v1h-2zM4 9h3v1h-3zM9 9h3v1h-3zM5 10h6v1h-6zM3 14h1v1h-1zM7 14h2v1h-2zM12 14h1v1h-1zM3 15h1v1h-1zM6 15h1v1h-1zM9 15h1v1h-1zM12 15h1v1h-1zM7 16h2v1h-2z",
    },
  ],
  herald: [
    {
      fill: INK,
      d: "M5 1h6v1h-6zM4 2h8v1h-8zM3 3h10v1h-10zM3 4h2v1h-2zM11 4h2v1h-2zM3 5h1v1h-1zM12 5h1v1h-1zM3 6h1v1h-1zM5 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM3 7h1v1h-1zM12 7h1v1h-1zM3 8h1v1h-1zM6 8h1v1h-1zM9 8h1v1h-1zM12 8h1v1h-1zM7 9h2v1h-2zM12 9h1v1h-1zM4 10h1v1h-1zM11 10h1v1h-1zM5 11h6v1h-6zM4 12h1v1h-1zM11 12h1v1h-1zM3 13h1v1h-1zM12 13h1v1h-1zM2 14h1v1h-1zM4 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM2 15h1v1h-1zM4 15h1v1h-1zM11 15h1v1h-1zM13 15h1v1h-1zM3 16h1v1h-1zM5 16h1v1h-1zM10 16h1v1h-1zM12 16h1v1h-1zM5 17h1v1h-1zM10 17h1v1h-1zM5 18h1v1h-1zM7 18h2v1h-2zM10 18h1v1h-1zM4 19h4v1h-4zM9 19h4v1h-4z",
    },
    {
      fill: RED,
      d: "M2 3h1v1h-1zM13 3h1v1h-1zM2 4h1v1h-1zM13 4h1v1h-1zM1 5h2v1h-2zM13 5h2v1h-2zM1 6h2v1h-2zM13 6h2v1h-2zM2 7h1v1h-1zM2 8h1v1h-1zM2 9h2v1h-2zM7 13h2v1h-2zM7 14h2v1h-2zM7 15h2v1h-2z",
    },
    {
      fill: CREAM,
      d: "M5 4h6v1h-6zM4 5h8v1h-8zM4 6h1v1h-1zM6 6h4v1h-4zM11 6h1v1h-1zM4 7h8v1h-8zM4 8h2v1h-2zM7 8h2v1h-2zM10 8h2v1h-2zM4 9h3v1h-3zM9 9h3v1h-3zM5 10h6v1h-6zM3 15h1v1h-1zM12 15h1v1h-1z",
    },
    {
      fill: BURGUNDY,
      d: "M5 12h6v1h-6zM4 13h3v1h-3zM9 13h3v1h-3zM3 14h1v1h-1zM5 14h2v1h-2zM9 14h2v1h-2zM12 14h1v1h-1zM5 15h2v1h-2zM9 15h2v1h-2zM6 16h4v1h-4zM6 17h4v1h-4zM6 18h1v1h-1zM9 18h1v1h-1z",
    },
  ],
  host: [
    {
      fill: INK,
      d: "M7 0h2v1h-2zM6 1h4v1h-4zM5 2h6v1h-6zM4 3h8v1h-8zM3 4h3v1h-3zM10 4h3v1h-3zM3 5h2v1h-2zM11 5h2v1h-2zM3 6h1v1h-1zM5 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM3 7h1v1h-1zM12 7h1v1h-1zM3 8h1v1h-1zM6 8h1v1h-1zM9 8h1v1h-1zM12 8h1v1h-1zM3 9h1v1h-1zM7 9h2v1h-2zM12 9h1v1h-1zM4 10h1v1h-1zM11 10h1v1h-1zM5 11h6v1h-6zM4 12h1v1h-1zM11 12h1v1h-1zM3 13h1v1h-1zM12 13h1v1h-1zM2 14h1v1h-1zM4 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM2 15h1v1h-1zM4 15h1v1h-1zM11 15h1v1h-1zM13 15h1v1h-1zM3 16h1v1h-1zM5 16h1v1h-1zM10 16h1v1h-1zM12 16h1v1h-1zM5 17h1v1h-1zM10 17h1v1h-1zM5 18h1v1h-1zM7 18h2v1h-2zM10 18h1v1h-1zM4 19h4v1h-4zM9 19h4v1h-4z",
    },
    {
      fill: CREAM,
      d: "M6 4h4v1h-4zM5 5h6v1h-6zM4 6h1v1h-1zM6 6h4v1h-4zM11 6h1v1h-1zM5 7h6v1h-6zM4 8h2v1h-2zM7 8h2v1h-2zM10 8h2v1h-2zM4 9h3v1h-3zM9 9h3v1h-3zM5 10h6v1h-6zM6 13h4v1h-4zM6 14h4v1h-4zM12 14h1v1h-1zM3 15h1v1h-1zM6 15h4v1h-4zM12 15h1v1h-1zM6 16h4v1h-4z",
    },
    {
      fill: RED,
      d: "M4 7h1v1h-1zM11 7h1v1h-1zM13 11h3v1h-3zM13 12h1v1h-1zM15 12h1v1h-1zM13 13h3v1h-3zM14 14h1v1h-1zM14 15h1v1h-1zM14 16h2v1h-2zM14 17h1v1h-1zM14 18h2v1h-2z",
    },
    {
      fill: BURGUNDY,
      d: "M5 12h6v1h-6zM4 13h2v1h-2zM10 13h2v1h-2zM3 14h1v1h-1zM5 14h1v1h-1zM10 14h1v1h-1zM5 15h1v1h-1zM10 15h1v1h-1zM6 17h4v1h-4zM6 18h1v1h-1zM9 18h1v1h-1z",
    },
  ],
};
