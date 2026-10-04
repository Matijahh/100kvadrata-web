"use client";

import { buttonClasses } from "@/components/genericComponents/Button";
import { Modal } from "@/components/ui/Modal";
import { APP_PROMPT_DISMISSED_KEY } from "@/constants/storageKeys";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/content/common";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// On phones the native app is the better experience, so mobile visitors get a
// one-time sheet pointing at their store. Dismissing it hides it for two weeks.
// Desktop never sees it — the nav rail has a small QR card instead.

const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

type MobilePlatform = "ios" | "android";

const detectPlatform = (): MobilePlatform | null => {
  const userAgent = navigator.userAgent;
  if (/android/i.test(userAgent)) return "android";
  // iPadOS reports itself as a Mac; a touch-capable "Mac" is an iPad.
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) return "ios";
  return null;
};

const isSnoozed = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(APP_PROMPT_DISMISSED_KEY));
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < SNOOZE_MS;
  } catch {
    // Storage blocked: showing it on every visit would be worse than never.
    return true;
  }
};

export function GetTheAppPrompt() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<MobilePlatform | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const detected = detectPlatform();
    if (detected && !isSnoozed()) {
      setPlatform(detected);
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(APP_PROMPT_DISMISSED_KEY, String(Date.now()));
    } catch {
      // Nothing to do — the prompt simply comes back next visit.
    }
  };

  if (!platform) {
    return null;
  }

  const storeUrl = platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && dismiss()}
      title={t("web.getApp.title")}
      description={t("web.getApp.message")}
    >
      <div className="mt-6 flex flex-col items-stretch gap-3">
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener"
          onClick={dismiss}
          className={buttonClasses({ fullWidth: true })}
        >
          {t("web.getApp.open")}
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="py-2 text-sm text-text-muted hover:text-text"
        >
          {t("web.getApp.continueOnWeb")}
        </button>
      </div>
    </Modal>
  );
}
