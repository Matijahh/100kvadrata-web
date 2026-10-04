"use client";

import GoogleLogo from "@assets/icons/google-logo.svg";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import type { OAuthProvider } from "@/services/socialAuth";
import type { AppLanguage } from "@/types/types";
import { useLocale } from "next-intl";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Web counterpart of the app's SocialAuthButtons. Same providers and accounts,
// but each button leaves the page for the provider's consent screen; the result
// comes back through /auth/callback. Apple is offered on every platform here —
// on the web it is the only way in for anyone who signed up with Apple on an
// iPhone, especially behind "Hide my email".

type SocialAuthButtonsProps = {
  disabled?: boolean;
  /** Where to land after signing in (an app path, e.g. "/feed"). */
  next?: string;
  /**
   * Runs before leaving for the provider; returning false stops the flow. Use
   * this for anything the user can still act on (e.g. unaccepted terms) — a
   * grey button cannot say what is missing, and the guard can.
   */
  onBeforeAuth?: () => boolean;
};

function AppleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.77-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.4-3.67zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  );
}

export function SocialAuthButtons({ disabled = false, next, onBeforeAuth }: SocialAuthButtonsProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const locale = useLocale() as AppLanguage;
  const loginWithProvider = useAuthStore((state) => state.loginWithProvider);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);

  const isBusy = disabled || pendingProvider !== null;

  const handlePress = async (provider: OAuthProvider) => {
    if (onBeforeAuth && !onBeforeAuth()) {
      return;
    }

    try {
      setPendingProvider(provider);
      // Navigates away on success; this component never sees the result.
      await loginWithProvider(provider, next, locale);
    } catch (error) {
      console.error(`${provider} login error:`, error);
      showToast({ type: "error", message: t("auth.socialLoginFailed") });
      setPendingProvider(null);
    }
  };

  return (
    <div>
      <div className="mb-4 mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-text-muted/50" />
        <span className="text-[13px] text-text-muted">{t("auth.orContinueWith")}</span>
        <span className="h-px flex-1 bg-text-muted/50" />
      </div>

      {/* Brand-guideline colours (Google light button / Apple black button)
          are intentionally not theme tokens. */}
      <button
        type="button"
        onClick={() => handlePress("google")}
        disabled={isBusy}
        className="flex w-full items-center justify-center gap-2.5 rounded-[25px] border border-[#DADCE0] bg-white p-[13px] text-[15px] font-semibold text-[#1F1F1F] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <GoogleLogo width={20} height={20} aria-hidden />
        {t("auth.googleButton")}
      </button>

      <button
        type="button"
        onClick={() => handlePress("apple")}
        disabled={isBusy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[25px] bg-black p-[13px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <AppleLogo />
        {t("auth.appleButton")}
      </button>
    </div>
  );
}
