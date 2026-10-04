import { DEFAULT_LANGUAGE } from "@/i18n/resources";
import { AppLanguage } from "@/types/types";
import { create } from "zustand";

// Platform adapter — on the web the URL is the source of truth for the
// language ("/" Serbian, "/en" English), so this store is not persisted: the
// language provider sets it from the route, and switching language navigates to
// the other locale's URL.

type LanguageStore = {
  language: AppLanguage;
  hydrated: boolean;
  setLanguage: (language: AppLanguage) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: DEFAULT_LANGUAGE,
  hydrated: true,
  setLanguage: (language) => set({ language }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
