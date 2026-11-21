"use client";

import { CriteriaFields } from "@/components/criteria/CriteriaFields";
import Button, { buttonClasses } from "@/components/genericComponents/Button";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { OnboardingIllustration } from "@/components/onboarding/OnboardingIllustration";
import { PreferenceDescriptionField } from "@/components/profile/PreferenceDescriptionField";
import { useToast } from "@/components/providers/ToastProvider";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { fetchActiveCountries } from "@/services/locations";
import {
  createPreferenceSet,
  fetchPreferenceSets,
  PREFERENCE_SET_LIMIT_ERROR,
} from "@/services/preferences";
import { useAuthStore } from "@/stores/useAuthStore";
import { MAX_PREFERENCE_SETS, type PreferenceCriteria } from "@/types/types";
import { hasStatedCriteria } from "@/utils/preferenceSets";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * "What you're looking for" in the navigation — web port of the app's
 * (tabs)/lookingFor: always the form for a new set. Existing sets are edited
 * from their cards on the profile (/preferences/:id), so this page never has
 * to ask which one you meant. Once all of them are in use it says so instead
 * of offering a form that could only fail on save.
 */
export function LookingForView() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const userId = sessionUser?.id ?? "";
  const [criteria, setCriteria] = useState<PreferenceCriteria>({});

  // Shared with the profile's cards, so deleting one there opens this form
  // back up without a fetch of its own.
  const preferenceSetsQuery = useQuery({
    queryKey: queryKeys.preferenceSets(userId),
    queryFn: () => fetchPreferenceSets(userId),
    enabled: !!sessionUser,
  });

  const { data: countries } = useQuery({
    queryKey: queryKeys.activeCountries,
    queryFn: fetchActiveCountries,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // A failed count falls through to the form: the create call checks the
  // limit again, and so does the database.
  const isAtLimit = (preferenceSetsQuery.data?.length ?? 0) >= MAX_PREFERENCE_SETS;

  const saveMutation = useMutation({
    // The country is not asked (one option is not a question), but sellers
    // filter the Buyers feed by it, so a set without one would never match.
    mutationFn: () =>
      createPreferenceSet(userId, {
        ...criteria,
        state: criteria.state ?? countries?.[0]?.name ?? "Srbija",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferenceSets(userId) });
      // A new card for everyone browsing the Buyers feed.
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      setCriteria({});
      showToast({ type: "success", message: t("preferences.saveSuccess") });
      // Back to the feed, the way publishing a listing ends.
      router.replace("/feed");
    },
    onError: (error: Error) => {
      console.error("[looking-for] save failed:", error);

      if (error?.message === PREFERENCE_SET_LIMIT_ERROR) {
        // Another device filled the last slot: catch up and show the limit.
        queryClient.invalidateQueries({ queryKey: queryKeys.preferenceSets(userId) });
      }

      showToast({
        type: "error",
        message:
          error?.message === PREFERENCE_SET_LIMIT_ERROR
            ? t("preferences.limitReached")
            : t("preferences.saveError"),
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (saveMutation.isPending) return;

    // An empty set never reaches the Buyers feed (has_preferences), and from
    // here nobody would even see the blank card it leaves on the profile.
    if (!hasStatedCriteria(criteria)) {
      showToast({ type: "error", message: t("preferences.emptySaveError") });
      return;
    }

    saveMutation.mutate();
  };

  const saveLabel = saveMutation.isPending ? t("preferences.saving") : t("preferences.save");
  const isLoading = !sessionUser || preferenceSetsQuery.isLoading;
  const showForm = !isLoading && !isAtLimit;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-page px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10"
    >
      <div className="mb-2 flex items-center gap-4">
        <h1 className="flex-1 font-display text-3xl text-text">{t("preferences.title")}</h1>
        {showForm ? (
          <Button
            type="submit"
            title={saveLabel}
            disabled={saveMutation.isPending}
            className="hidden min-w-0 md:inline-flex"
          />
        ) : null}
      </div>
      <p className="mb-6 text-sm text-text-muted">{t("preferences.subtitle")}</p>

      {isLoading ? (
        <Spinner className="py-24" />
      ) : isAtLimit ? (
        <div className="flex flex-col items-center rounded-[32px] bg-surface px-6 py-12 text-center md:px-10">
          <OnboardingIllustration spot="lookingForLimit" height={150} className="mb-5" />
          <h2 className="font-display text-xl text-text">
            {t("preferences.tabLimitTitle", { max: MAX_PREFERENCE_SETS })}
          </h2>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            {t("preferences.tabLimitBody", { max: MAX_PREFERENCE_SETS })}
          </p>
          <Link href="/profile?section=preferences" className={cn(buttonClasses(), "mt-6")}>
            {t("preferences.tabLimitCta")}
          </Link>
        </div>
      ) : (
        <div className="rounded-[32px] bg-surface p-5 md:p-8">
          <PreferenceDescriptionField
            value={criteria.description ?? ""}
            onChange={(value) => setCriteria((current) => ({ ...current, description: value }))}
          />
          <CriteriaFields value={criteria} onChange={setCriteria} />

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              title={saveLabel}
              disabled={saveMutation.isPending}
              fullWidth
              className="md:w-auto"
            />
          </div>
        </div>
      )}
    </form>
  );
}
