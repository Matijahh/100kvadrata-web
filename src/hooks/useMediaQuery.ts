"use client";

import { useSyncExternalStore } from "react";

/**
 * Live result of a CSS media query. False during server rendering and the
 * first client render, so use it for things that only matter after an
 * interaction (which container a picker opens in), not for the initial layout —
 * that belongs in responsive CSS.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's `md` breakpoint and up. */
export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
