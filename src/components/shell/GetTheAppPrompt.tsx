"use client";

import CloseIcon from "@assets/icons/close-icon.svg";
import Logo from "@assets/logo.svg";
import { APP_PROMPT_DISMISSED_KEY } from "@/constants/storageKeys";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/content/common";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// The app is the better 100m², so every visitor — phone or desktop — gets a
// small card pointing at both stores. It never blocks the page and stays on
// every screen until it is closed; closing it is remembered in localStorage
// for good (it only comes back if that storage is cleared).

const isDismissed = () => {
  try {
    return localStorage.getItem(APP_PROMPT_DISMISSED_KEY) != null;
  } catch {
    // Storage blocked: closing could never stick, and a card that comes back
    // on every visit would be worse than none.
    return true;
  }
};

export function GetTheAppPrompt({
  aboveTabBar = false,
  onAuthScreen = false,
}: {
  /** Phones: sit above the app's bottom tab bar. */
  aboveTabBar?: boolean;
  /**
   * Login, register and the like. Phones get room under the form so its last
   * buttons can scroll clear of the card; from `md` the card sits over the
   * photo half, leaving the form alone.
   */
  onAuthScreen?: boolean;
}) {
  const { t } = useTranslation();
  // Decided after mount: the server cannot see localStorage.
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isDismissed());
  }, []);

  const close = () => {
    setVisible(false);
    try {
      localStorage.setItem(APP_PROMPT_DISMISSED_KEY, "1");
    } catch {
      // Already handled: with storage blocked the card never shows.
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {onAuthScreen ? (
        <div aria-hidden className="h-[calc(200px+env(safe-area-inset-bottom))] bg-surface md:hidden" />
      ) : null}
      <aside
        aria-label={t("web.getApp.title")}
        className={cn(
          "fixed inset-x-3 z-40 rounded-3xl bg-surface p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)] motion-safe:animate-[card-up_300ms_cubic-bezier(0.33,1,0.68,1)]",
          // Phones: over the bottom tab bar when there is one, else the screen edge.
          aboveTabBar
            ? "bottom-[calc(88px+env(safe-area-inset-bottom))]"
            : "bottom-[calc(12px+env(safe-area-inset-bottom))]",
          // Tablet / desktop: a card in a bottom corner.
          "md:inset-x-auto md:bottom-6 md:w-[360px] md:p-5",
          onAuthScreen ? "md:left-6" : "md:right-6",
        )}
      >
        <button
          type="button"
          onClick={close}
          aria-label={t("web.common.close")}
          title={t("web.common.close")}
          className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
        >
          <CloseIcon width={20} height={20} aria-hidden />
        </button>

        <div className="flex items-start gap-3">
          {/* The logo's lettering is white, so it sits on the app icon's dark tile. */}
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#161722]" aria-hidden>
            <Logo width={34} height={19} />
          </span>
          <div className="min-w-0">
            {/* Only the title shares its line with the X. */}
            <p className="pr-8 font-display text-[17px] leading-6 text-text">{t("web.getApp.title")}</p>
            <p className="mt-1 text-pretty text-sm leading-5 text-text-muted">{t("web.getApp.message")}</p>
          </div>
        </div>

        {/* The official badges, cropped to the badge itself, so one height lines
            them up as the store guidelines ask. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href={APP_STORE_URL} target="_blank" rel="noopener" className="rounded-lg transition-opacity hover:opacity-85">
            <img src="/badges/app-store.svg" alt={t("web.getApp.appStore")} width={120} height={40} className="h-10 w-auto" />
          </a>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener" className="rounded-lg transition-opacity hover:opacity-85">
            <img src="/badges/google-play.png" alt={t("web.getApp.googlePlay")} width={133} height={40} className="h-10 w-auto" />
          </a>
        </div>
      </aside>
    </>
  );
}
