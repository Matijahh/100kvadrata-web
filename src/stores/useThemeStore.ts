import { THEME_STORAGE_KEY } from "@/constants/storageKeys";
import { AppThemePreference } from "@/types/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Platform adapter — same shape as the app's store, persisted to localStorage.
// The key is also read by the inline script in <ThemeTokens /> before first
// paint, so a dark-theme visitor never sees a light flash.

type ThemeStore = {
  theme: AppThemePreference;
  hydrated: boolean;
  setTheme: (theme: AppThemePreference) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "system",
      hydrated: false,
      setTheme: (theme) => set({ theme }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
