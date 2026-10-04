"use client";

import i18n, { getI18n } from "@/i18n";
import { useLanguageStore } from "@/stores/useLanguageStore";
import type { AppLanguage } from "@/types/types";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

// The URL decides the language on the web ("/" Serbian, "/en" English).
// Components get a fixed-language i18next instance for it — identical output
// on the server and in the browser — while the default instance (used by shared
// services such as chat's listing labels) and the language store follow along
// in the browser. Web counterpart of the app's LanguageSync.
export function LanguageProvider({
  locale,
  children,
}: {
  locale: AppLanguage;
  children: React.ReactNode;
}) {
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    setLanguage(locale);
    document.documentElement.lang = locale;
  }, [locale, setLanguage]);

  return <I18nextProvider i18n={getI18n(locale)}>{children}</I18nextProvider>;
}
