import type { Locale } from "@/i18n/routing";

export const APP_STORE_URL = "https://apps.apple.com/rs/app/100m/id6794867780";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.stokvadrata.app";
export const CONTACT_EMAIL = "podrska@100-kvadrata.rs";
export const SITE_ORIGIN = "https://100-kvadrata.rs";

/** Prefix a root-relative path with the locale segment ("" for sr, "/en"). */
export function withLocale(locale: Locale, path: string): string {
  const prefix = locale === "en" ? "/en" : "";
  const clean = path === "/" ? "" : path;
  return prefix + clean || "/";
}

type Chrome = {
  skip: string;
  homeAria: string;
  langAria: string;
  footNote: string;
  /** Alt text for the store badges (the badge artwork itself is English). */
  stores: { appStore: string; googlePlay: string };
  labels: {
    home: string;
    privacy: string;
    terms: string;
    contact: string;
    otherLang: string;
  };
};

export const chrome: Record<Locale, Chrome> = {
  sr: {
    skip: "Preskoči na sadržaj",
    homeAria: "100m² - Početna",
    langAria: "Jezik",
    footNote: "© 2026 100m². Sva prava zadržana.",
    stores: {
      appStore: "Preuzmi na App Store-u",
      googlePlay: "Preuzmi na Google Play-u",
    },
    labels: {
      home: "Početna",
      privacy: "Politika privatnosti",
      terms: "Uslovi korišćenja",
      contact: "Kontakt",
      otherLang: "English",
    },
  },
  en: {
    skip: "Skip to content",
    homeAria: "100m² — home",
    langAria: "Language",
    footNote: "© 2026 100m². All rights reserved.",
    stores: {
      appStore: "Download on the App Store",
      googlePlay: "Get it on Google Play",
    },
    labels: {
      home: "Home",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      contact: "Contact",
      otherLang: "Srpski",
    },
  },
};
