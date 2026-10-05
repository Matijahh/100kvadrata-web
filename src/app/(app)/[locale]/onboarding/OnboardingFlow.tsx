"use client";

import ChevronLeftIcon from "@assets/icons/chevron-left-icon.svg";
import { CriteriaFields } from "@/components/criteria/CriteriaFields";
import Button from "@/components/genericComponents/Button";
import { AccountTypePicker } from "@/components/onboarding/AccountTypePicker";
import { AllSetHero } from "@/components/onboarding/AllSetHero";
import { OnboardingIllustration } from "@/components/onboarding/OnboardingIllustration";
import { PreferenceDescriptionField } from "@/components/profile/PreferenceDescriptionField";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { fetchActiveCountries } from "@/services/locations";
import { createPreferenceSet } from "@/services/preferences";
import { updateAccountType } from "@/services/profile";
import { useAuthStore } from "@/stores/useAuthStore";
import type { AccountType, PreferenceCriteria } from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Step = "accountType" | "details" | "ready";

/**
 * Web port of flatswipe/src/app/(protected)/onboarding.tsx — same steps, same
 * writes. The account type is the one required answer; a buyer then describes
 * what they are after (their first preference set, skippable), a seller goes
 * straight to the "post your first listing" nudge.
 */
export function OnboardingFlow() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);

  const [step, setStep] = useState<Step>("accountType");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [prefs, setPrefs] = useState<PreferenceCriteria>({});

  const { data: countries } = useQuery({
    queryKey: queryKeys.activeCountries,
    queryFn: fetchActiveCountries,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Sellers filter the Buyers feed by country, so a buyer with no country set
  // would never match. Onboarding does not ask — it records the default.
  const defaultCountryName = countries?.[0]?.name ?? "Srbija";

  const accountTypeMutation = useMutation({
    mutationFn: (next: AccountType) => updateAccountType(sessionUser!.id, next),
    onSuccess: () => {
      if (!sessionUser) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(sessionUser.id) });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
    },
  });

  const firstSetMutation = useMutation({
    mutationFn: (criteria: PreferenceCriteria) => createPreferenceSet(sessionUser!.id, criteria),
    onSuccess: () => {
      if (!sessionUser) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.preferenceSets(sessionUser.id) });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
    },
  });

  const isSaving = accountTypeMutation.isPending || firstSetMutation.isPending;

  const setField = <K extends keyof PreferenceCriteria>(key: K, value: PreferenceCriteria[K]) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  const goToFeed = () => router.replace("/feed");

  const handleAccountTypeContinue = async () => {
    if (!accountType || !sessionUser) return;

    // Saved before the next step so the answer survives closing the tab: the
    // details are optional, the type is the part that matters.
    try {
      await accountTypeMutation.mutateAsync(accountType);
    } catch (error) {
      console.error("[onboarding] account type save failed:", error);
      showToast({ type: "error", message: t("onboarding.saveError") });
      return;
    }

    setStep(accountType === "seller" ? "ready" : "details");
  };

  const handleDetailsSubmit = async () => {
    try {
      await firstSetMutation.mutateAsync({
        ...prefs,
        state: prefs.state ?? defaultCountryName,
      });
    } catch (error) {
      console.error("[onboarding] first preference set failed:", error);
      showToast({ type: "error", message: t("onboarding.saveError") });
      return;
    }

    setStep("ready");
  };

  const stepOrder: Step[] =
    accountType === "seller" ? ["accountType", "ready"] : ["accountType", "details", "ready"];

  const progress = (
    <div className="flex justify-center gap-[7px]" aria-hidden>
      {stepOrder.map((name) => (
        <span
          key={name}
          className={cn(
            "h-[7px] rounded-full bg-border transition-all",
            name === step ? "w-5 bg-primary" : "w-[7px]",
          )}
        />
      ))}
    </div>
  );

  const footer = (children: React.ReactNode) => (
    <footer className="sticky bottom-0 border-t border-border bg-surface px-6 pb-7 pt-3.5">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3.5">
        {progress}
        {children}
      </div>
    </footer>
  );

  const secondaryAction = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="self-center px-3 py-1 text-sm font-semibold text-text-muted hover:text-text"
    >
      {label}
    </button>
  );

  if (step === "accountType") {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-6 pt-10 md:justify-center">
          <OnboardingIllustration
            spot="welcome"
            height={240}
            className="mb-3 [&_svg]:h-[clamp(110px,calc(100dvh-555px),240px)] [&_svg]:w-auto md:[&_svg]:h-[clamp(110px,calc(100dvh-555px),320px)]"
          />
          <h1 className="text-center font-display text-[26px] leading-8 text-text">
            {t("onboarding.welcomeTitle")}
          </h1>
          <p className="mt-2.5 text-center text-[15px] leading-[22px] text-text-muted">
            {t("onboarding.welcomeSubtitle")}
          </p>
          <div className="mt-7">
            <AccountTypePicker value={accountType} onChange={setAccountType} />
          </div>
          <p className="mt-5 text-center text-[13px] font-light leading-[18px] text-text-muted">
            {t("onboarding.changeLater")}
          </p>
        </main>
        {footer(
          <Button
            title={isSaving ? t("onboarding.saving") : t("onboarding.continue")}
            onClick={handleAccountTypeContinue}
            disabled={!accountType || isSaving}
            fullWidth
          />,
        )}
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <header className="mx-auto w-full max-w-3xl px-6 pb-1 pt-6">
          <button
            type="button"
            onClick={() => setStep("accountType")}
            aria-label={t("common.back")}
            className="-ml-2 rounded-full p-2 text-text hover:bg-surface-muted"
          >
            <ChevronLeftIcon width={24} height={24} aria-hidden />
          </button>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-6">
          <OnboardingIllustration spot="details" height={110} className="mb-3 md:[&_svg]:h-[150px] md:[&_svg]:w-auto" />
          <h1 className="text-center font-display text-[26px] leading-8 text-text">
            {t("onboarding.detailsTitle")}
          </h1>
          <p className="mx-auto mt-2.5 max-w-xl text-center text-[15px] leading-[22px] text-text-muted">
            {t("onboarding.detailsSubtitle")}
          </p>

          <div className="mt-7">
            <PreferenceDescriptionField
              value={prefs.description ?? ""}
              onChange={(value) => setField("description", value)}
            />

            <CriteriaFields value={prefs} onChange={setPrefs} />
          </div>
        </main>

        {footer(
          <>
            <Button
              title={isSaving ? t("onboarding.saving") : t("onboarding.detailsCta")}
              onClick={handleDetailsSubmit}
              disabled={isSaving}
              fullWidth
            />
            {/* Skipping writes nothing: an empty preference set would not list
                its owner among buyers anyway (see has_preferences). */}
            {secondaryAction(t("onboarding.detailsSkip"), goToFeed)}
          </>,
        )}
      </div>
    );
  }

  const isSeller = accountType === "seller";

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 px-6 py-10">
        <AllSetHero
          spot={isSeller ? "readySeller" : "readyBuyer"}
          title={t("onboarding.readyTitle")}
          body={t(isSeller ? "onboarding.readyBodySeller" : "onboarding.readyBodyBuyer")}
        />
      </main>
      {footer(
        isSeller ? (
          <>
            <Button
              title={t("onboarding.readyPrimaryCta")}
              onClick={() => router.replace("/new-listing")}
              fullWidth
            />
            {secondaryAction(t("onboarding.readySecondaryCta"), goToFeed)}
          </>
        ) : (
          <Button title={t("onboarding.readyBuyerCta")} onClick={goToFeed} fullWidth />
        ),
      )}
    </div>
  );
}
