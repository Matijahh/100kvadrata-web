"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const LANGUAGE_SYNCED_KEY = "100m2.profileLanguageSynced";

// Web counterpart of the app's ProfilePreferencesSync: the theme and language
// saved on the profile follow the user to the web. Language is the URL here, so
// it is applied by moving to the other locale — once per browser session, so a
// user who deliberately opens a link in the other language is not bounced back
// on every navigation.
export function ProfilePreferencesSync() {
  const { currentUser } = useCurrentUser();
  const language = useLanguageStore((state) => state.language);
  const setTheme = useThemeStore((state) => state.setTheme);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (currentUser?.preferredTheme) {
      setTheme(currentUser.preferredTheme);
    }
  }, [currentUser?.preferredTheme, setTheme]);

  useEffect(() => {
    const preferred = currentUser?.preferredLanguage;

    if (!preferred) {
      return;
    }

    try {
      if (sessionStorage.getItem(LANGUAGE_SYNCED_KEY)) {
        return;
      }
      sessionStorage.setItem(LANGUAGE_SYNCED_KEY, "1");
    } catch {
      return;
    }

    if (preferred !== language) {
      const query = searchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { locale: preferred });
    }
  }, [currentUser?.preferredLanguage, language, pathname, router, searchParams]);

  return null;
}
