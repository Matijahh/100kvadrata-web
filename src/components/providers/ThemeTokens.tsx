import { darkColors, lightColors, type ThemeColors } from "@/theme/palette";
import { THEME_STORAGE_KEY } from "@/constants/storageKeys";

// Writes the app's colour tokens (synced from flatswipe) as CSS variables for
// both themes, so the Tailwind colours in app.css always match the mobile app.
// No build step: palette.ts is plain data, read here on the server.

const toKebab = (key: string) => key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

const declarations = (colors: ThemeColors) =>
  Object.entries(colors)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => `--c-${toKebab(key)}:${value};`)
    .join("");

const avatarPalette = (colors: ThemeColors) =>
  colors.avatarPalette.map((color, index) => `--c-avatar-${index}:${color};`).join("");

const relativeLuminance = (hex: string) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return 0;
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(match[1].slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// White or near-black on a chart fill, whichever contrasts more (same rule as
// the app's SegmentedBar).
const NEAR_BLACK = "#161722";
const inkOn = (fill: string) => {
  const luminance = relativeLuminance(fill);
  const onWhite = 1.05 / (luminance + 0.05);
  const onBlack = (luminance + 0.05) / (relativeLuminance(NEAR_BLACK) + 0.05);
  return onWhite >= onBlack ? "#FFFFFF" : NEAR_BLACK;
};

// Group colours of the admin statistics charts: --c-chart-N and the text
// colour that reads on it, --c-chart-ink-N.
const chartSeries = (colors: ThemeColors) =>
  colors.chartSeries
    .map((color, index) => `--c-chart-${index}:${color};--c-chart-ink-${index}:${inkOn(color)};`)
    .join("");

const tokens = (colors: ThemeColors) =>
  `${declarations(colors)}${avatarPalette(colors)}${chartSeries(colors)}`;

const css =
  `:root{${tokens(lightColors)}color-scheme:light;}` +
  `[data-theme="dark"]{${tokens(darkColors)}color-scheme:dark;}`;

// Resolves the stored preference (light / dark / system) before first paint so
// a dark-theme visitor never sees a light flash. Mirrors resolveThemeScheme in
// the app. ThemeSync takes over after hydration.
const themeScript = `(function(){try{var p="system";var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(s){p=(JSON.parse(s).state||{}).theme||p}var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})();`;

export function ThemeTokens() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    </>
  );
}
