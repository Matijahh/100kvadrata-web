"use client";

import { ChoiceChips } from "@/components/form/ChoiceChips";
import { FlaggedListingsSection } from "@/components/profile/FlaggedListingsSection";
import { ReportedUsersSection } from "@/components/profile/ReportedUsersSection";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type FlaggedView = "listings" | "users";

const isFlaggedView = (value: string | null): value is FlaggedView =>
  value === "listings" || value === "users";

/**
 * The admin's Flagged tab: reported listings and users reported from a chat,
 * one switch between them. `?flagged=users` opens on the users (a user
 * report's notification links there when the account is gone).
 */
export function FlaggedSection() {
  const { t } = useTranslation();
  const requestedView = useSearchParams().get("flagged");
  const [view, setView] = useState<FlaggedView>(() =>
    isFlaggedView(requestedView) ? requestedView : "listings",
  );

  useEffect(() => {
    if (isFlaggedView(requestedView)) setView(requestedView);
  }, [requestedView]);

  return (
    <div className="flex flex-col gap-4">
      <ChoiceChips<FlaggedView>
        options={[
          { value: "listings", label: t("moderation.flaggedListingsView") },
          { value: "users", label: t("moderation.flaggedUsersView") },
        ]}
        value={view}
        onChange={setView}
        ariaLabel={t("moderation.flaggedViewLabel")}
      />
      {view === "listings" ? <FlaggedListingsSection /> : <ReportedUsersSection />}
    </div>
  );
}
