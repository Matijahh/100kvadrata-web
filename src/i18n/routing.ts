import { defineRouting } from "next-intl/routing";

// Serbian is the default and lives at the root ("/"), English is prefixed
// ("/en"). Locale detection is off so "/" is always Serbian regardless of the
// visitor's Accept-Language — matching the original static site.
export const routing = defineRouting({
  locales: ["sr", "en"],
  defaultLocale: "sr",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
