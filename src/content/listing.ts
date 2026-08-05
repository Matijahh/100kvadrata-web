import type { Locale } from "@/i18n/routing";

export type ListingContent = {
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogLocale: string;
  };
  h1: string;
  lede: string;
  cta: string;
  soon: string;
  openApp: string;
};

export const listing: Record<Locale, ListingContent> = {
  sr: {
    meta: {
      title: "Oglas — 100m²",
      description: "Otvori ovaj oglas u aplikaciji 100m².",
      ogTitle: "Pogledaj oglas na 100m²",
      ogDescription: "Otvori ovaj oglas u aplikaciji 100m².",
      ogLocale: "sr_RS",
    },
    h1: "Ovaj oglas se otvara u aplikaciji",
    lede: "Da bi video/la ovaj oglas i sve njegove detalje, potrebna ti je aplikacija 100m². Uđi na listu čekanja i prvi/a saznaj kad izađe.",
    cta: "UĐI NA LISTU ČEKANJA",
    soon: "App Store i Google Play - uskoro",
    openApp: "Već imaš aplikaciju? Otvori oglas.",
  },
  en: {
    meta: {
      title: "Listing — 100m²",
      description: "Open this listing in the 100m² app.",
      ogTitle: "View this listing on 100m²",
      ogDescription: "Open this listing in the 100m² app.",
      ogLocale: "en_US",
    },
    h1: "This listing opens in the app",
    lede: "To view this listing and all its details, you need the 100m² app. Join the waitlist to be first to know when it launches.",
    cta: "JOIN THE WAITLIST",
    soon: "App Store & Google Play - coming soon",
    openApp: "Already have the app? Open the listing.",
  },
};
