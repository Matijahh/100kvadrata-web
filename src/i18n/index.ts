import i18n, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import type { AppLanguage } from "@/types/types";
import { baseOptions, DEFAULT_LANGUAGE } from "./resources";

// Platform adapter — the mobile app's file at this path initialises the same
// dictionaries. Client-side only (react-i18next needs React context); server
// components translate with `getServerT` from "@/i18n/server".
//
// The default instance is what shared services use (`i18n.t(...)`); the
// language provider keeps it on the URL's locale. Components get a
// fixed-language instance per locale from `getI18n`, so a render never depends
// on mutable global language state.

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({ ...baseOptions, lng: DEFAULT_LANGUAGE });
}

const instances: Partial<Record<AppLanguage, I18nInstance>> = {};

/** A fixed-language i18next instance sharing the default one's resources. */
export const getI18n = (language: AppLanguage): I18nInstance => {
  instances[language] ??= i18n.cloneInstance({ lng: language, initAsync: false });
  return instances[language]!;
};

export { DEFAULT_LANGUAGE };
export default i18n;
