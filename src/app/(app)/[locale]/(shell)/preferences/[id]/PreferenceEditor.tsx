"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import { CriteriaFields } from "@/components/criteria/CriteriaFields";
import Button from "@/components/genericComponents/Button";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { PreferenceDescriptionField } from "@/components/profile/PreferenceDescriptionField";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { fetchActiveCountries } from "@/services/locations";
import {
  createPreferenceSet,
  deletePreferenceSet,
  fetchPreferenceSet,
  PREFERENCE_SET_LIMIT_ERROR,
  updatePreferenceSet,
} from "@/services/preferences";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PreferenceCriteria } from "@/types/types";
import { confirmDestructiveAction } from "@/utils/confirmAction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * One "what you're looking for" set — web port of the app's
 * preferences/[id]. The id is an existing set's or the literal "new"; the form
 * is the same either way, only the save path and Delete differ.
 */
export function PreferenceEditor({ id }: { id: string }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const isNew = id === "new";
  const [criteria, setCriteria] = useState<PreferenceCriteria>({});

  const preferenceSetQuery = useQuery({
    queryKey: sessionUser && !isNew ? queryKeys.preferenceSet(sessionUser.id, id) : ["preferenceSets", "new"],
    queryFn: () => fetchPreferenceSet(sessionUser!.id, id),
    enabled: !!sessionUser && !isNew,
  });

  useEffect(() => {
    if (preferenceSetQuery.data) setCriteria(preferenceSetQuery.data);
  }, [preferenceSetQuery.data]);

  const { data: countries } = useQuery({
    queryKey: queryKeys.activeCountries,
    queryFn: fetchActiveCountries,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/profile");
  };

  const invalidate = () => {
    if (sessionUser) {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferenceSets(sessionUser.id) });
    }
    // What this buyer is after changed, so the cards sellers see change too.
    queryClient.invalidateQueries({ queryKey: ["buyers"] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      // Not asked (one option is not a question), but sellers filter buyers
      // by country, so a set without one would never match.
      const payload = { ...criteria, state: criteria.state ?? countries?.[0]?.name ?? "Srbija" };
      return isNew
        ? createPreferenceSet(sessionUser!.id, payload)
        : updatePreferenceSet(sessionUser!.id, id, payload);
    },
    onSuccess: () => {
      invalidate();
      showToast({ type: "success", message: t("preferences.saveSuccess") });
      goBack();
    },
    onError: (error: Error) => {
      console.error("[preferences] save failed:", error);
      showToast({
        type: "error",
        message:
          error?.message === PREFERENCE_SET_LIMIT_ERROR
            ? t("preferences.limitReached")
            : t("preferences.saveError"),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePreferenceSet(sessionUser!.id, id),
    onSuccess: () => {
      invalidate();
      showToast({ type: "success", message: t("preferences.deleteSuccess") });
      goBack();
    },
    onError: (error) => {
      console.error("[preferences] delete failed:", error);
      showToast({ type: "error", message: t("preferences.deleteError") });
    },
  });

  const confirmDelete = () =>
    confirmDestructiveAction({
      title: t("preferences.deleteTitle"),
      message: t("preferences.deleteMessage"),
      confirmLabel: t("preferences.delete"),
      onConfirm: () => deleteMutation.mutate(),
    });

  const isBusy = saveMutation.isPending || deleteMutation.isPending;
  const saveLabel = saveMutation.isPending ? t("preferences.saving") : t("preferences.save");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isBusy) saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4 md:px-8 md:pt-8">
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("web.listing.back")}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text hover:bg-surface"
        >
          <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
        </button>
        <h1 className="flex-1 font-display text-2xl text-text">{t("preferences.title")}</h1>
        <Button type="submit" title={saveLabel} disabled={isBusy} className="hidden min-w-0 md:inline-flex" />
      </div>
      <p className="mb-6 pl-[52px] text-sm text-text-muted">{t("preferences.subtitle")}</p>

      {preferenceSetQuery.isLoading ? (
        <Spinner className="py-24" />
      ) : preferenceSetQuery.isError ? (
        <EmptyState title={t("preferences.loadError")} />
      ) : (
        <div className="rounded-[32px] bg-surface p-5 md:p-8">
          <PreferenceDescriptionField
            value={criteria.description ?? ""}
            onChange={(value) => setCriteria((current) => ({ ...current, description: value }))}
          />
          <CriteriaFields value={criteria} onChange={setCriteria} />

          <div className="mt-6 flex flex-col-reverse items-center gap-4 md:flex-row md:justify-between">
            {isNew ? (
              <span />
            ) : (
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isBusy}
                className="text-sm font-semibold text-destructive hover:underline disabled:opacity-60"
              >
                {t("preferences.delete")}
              </button>
            )}
            <Button type="submit" title={saveLabel} disabled={isBusy} fullWidth className="md:w-auto" />
          </div>
        </div>
      )}
    </form>
  );
}
