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

const css =
  `:root{${declarations(lightColors)}${avatarPalette(lightColors)}color-scheme:light;}` +
  `[data-theme="dark"]{${declarations(darkColors)}${avatarPalette(darkColors)}color-scheme:dark;}`;

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
