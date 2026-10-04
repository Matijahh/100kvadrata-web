import type { AppLanguage } from "@/types/types";
import { en } from "./en";
import { sr } from "./sr";
import { webEn } from "./webEn";
import { webSr } from "./webSr";

// The app's dictionaries (synced from flatswipe, identical keys and strings)
// plus the web-only copy under `web`. Shared by the client i18n instance and
// the server translator.

export const DEFAULT_LANGUAGE: AppLanguage = "sr";

export const resources = {
  en: { translation: { ...en, web: webEn } },
  sr: { translation: { ...sr, web: webSr } },
};

export const baseOptions = {
  compatibilityJSON: "v4" as const,
  fallbackLng: "en",
  resources,
  interpolation: { escapeValue: false },
  initAsync: false,
};
