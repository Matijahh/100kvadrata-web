"use client";

import { buttonClasses } from "@/components/genericComponents/Button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { useTranslation } from "react-i18next";

// Shown for unknown app URLs and for listings / profiles that no longer exist.
export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-3xl text-text">{t("web.listing.notFoundTitle")}</h1>
      <p className="text-text-muted">{t("web.listing.notFoundMessage")}</p>
      <Link href="/feed" className={cn(buttonClasses(), "mt-4")}>
        {t("web.listing.browseListings")}
      </Link>
    </div>
  );
}
