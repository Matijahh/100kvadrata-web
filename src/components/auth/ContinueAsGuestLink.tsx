"use client";

import { Link } from "@/i18n/navigation";
import { useTranslation } from "react-i18next";

/**
 * Way out of the auth screens for someone who does not want an account —
 * browsing is public, like in the app (App Store guideline 5.1.1(v) there).
 */
export function ContinueAsGuestLink() {
  const { t } = useTranslation();

  return (
    <div className="mt-5 text-center">
      <Link
        href="/feed"
        replace
        className="inline-block px-3 py-2 text-sm font-semibold text-text-muted underline underline-offset-2 hover:text-text"
      >
        {t("auth.continueAsGuest")}
      </Link>
    </div>
  );
}
