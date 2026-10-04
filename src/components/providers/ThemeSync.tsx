"use client";

import { useThemeStore } from "@/stores/useThemeStore";
import { useEffect } from "react";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Keeps <html data-theme> on the resolved theme after hydration (the inline
 * script in <ThemeTokens /> sets it before first paint). Follows the OS while
 * the preference is "system", like resolveThemeScheme in the app.
 */
export function ThemeSync() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);

    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
    };

    apply();

    if (theme !== "system") {
      return;
    }

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return null;
}

/** "light" or "dark" after applying the preference over the OS setting. */
export function useResolvedThemeScheme(): "light" | "dark" {
  const theme = useThemeStore((state) => state.theme);

  if (theme !== "system") {
    return theme;
  }

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}
