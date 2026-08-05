import type { Locale } from "@/i18n/routing";

export const WAITLIST_URL = "https://tally.so/r/7RzoL2";
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
    labels: {
      home: "Home",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      contact: "Contact",
      otherLang: "Srpski",
    },
  },
};
