import type { AppLanguage } from "@/types/types";

/**
 * The marketing site's home in the given language. It is a different root
 * layout from the app, so link to it with a plain <a> (full page load).
 */
export const websiteHref = (language: AppLanguage) => (language === "en" ? "/en" : "/");
