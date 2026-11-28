"use client";

import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { banReportedUser, dismissUserReports } from "@/services/reports";
import type { ReportedUser } from "@/types/types";
import { confirmDestructiveAction } from "@/utils/confirmAction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/**
 * Dismiss or block a user reported from a chat. Shared by the reported users
 * queue (each row) and the user's profile opened from the queue or a
 * notification. `onDone` runs after either succeeds.
 */
export function useReportedUserActions(onDone?: () => void) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const dropFromQueue = (userId: string) => {
    queryClient.setQueryData<ReportedUser[] | undefined>(queryKeys.reportedUsers, (current) =>
      current?.filter((reported) => reported.profile.id !== userId),
    );
    void queryClient.invalidateQueries({ queryKey: queryKeys.reportedUsers });
  };

  const dismissMutation = useMutation({
    mutationFn: (userId: string) => dismissUserReports(userId),
    onSuccess: (_result, userId) => {
      dropFromQueue(userId);
      showToast({ type: "success", message: t("moderation.dismissed") });
      onDone?.();
    },
    onError: () => showToast({ type: "error", message: t("moderation.dismissError") }),
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => banReportedUser(userId),
    onSuccess: (_result, userId) => {
      dropFromQueue(userId);
      showToast({ type: "success", message: t("moderation.accountBlocked") });
      onDone?.();
    },
    onError: () => showToast({ type: "error", message: t("moderation.blockAccountError") }),
  });

  const busyUserId =
    (dismissMutation.isPending ? dismissMutation.variables : undefined) ??
    (blockMutation.isPending ? blockMutation.variables : undefined);

  const askDismiss = (reported: ReportedUser) =>
    confirmDestructiveAction({
      title: t("moderation.dismissTitle"),
      message: t("moderation.dismissUserMessage", { username: reported.profile.username }),
      confirmLabel: t("moderation.dismissConfirm"),
      onConfirm: () => dismissMutation.mutate(reported.profile.id),
    });

  const askBlock = (reported: ReportedUser) =>
    confirmDestructiveAction({
      title: t("moderation.blockAccountTitle", { username: reported.profile.username }),
      message: t("moderation.blockAccountMessage"),
      confirmLabel: t("moderation.blockAccountConfirm"),
      onConfirm: () => blockMutation.mutate(reported.profile.id),
    });

  return { askDismiss, askBlock, busyUserId };
}

/** The two review buttons. Block is left out for admins and blocked accounts. */
export function ReportedUserActions({
  reported,
  busy,
  onDismiss,
  onBlock,
  className,
}: {
  reported: ReportedUser;
  busy: boolean;
  onDismiss: () => void;
  onBlock: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const canBlock = !reported.isBanned && !reported.profile.isAdmin;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={onDismiss}
        disabled={busy}
        className="min-h-9 rounded-full border-2 border-primary px-4 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
      >
        {t("moderation.dismissReports")}
      </button>
      {canBlock ? (
        <button
          type="button"
          onClick={onBlock}
          disabled={busy}
          className="min-h-9 rounded-full bg-destructive px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {t("moderation.blockAccount")}
        </button>
      ) : null}
    </div>
  );
}

/** Report counts and reasons, e.g. "3 prijave · Spam: 1 · Neprimereno: 2". */
export function ReportSummaryText({ reported }: { reported: ReportedUser }) {
  const { t } = useTranslation();
  return (
    <>
      {t("moderation.reportCount", { count: reported.reportCount })}
      {" · "}
      {t("moderation.reportSummary", {
        spam: reported.spamReportCount,
        inappropriate: reported.inappropriateReportCount,
      })}
    </>
  );
}

/**
 * Under a reported user's profile card when an admin opened it from the queue
 * or a notification: the counts and the two buttons.
 */
export function ReportedUserReview({
  reported,
  onDone,
}: {
  reported: ReportedUser;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { askDismiss, askBlock, busyUserId } = useReportedUserActions(onDone);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[24px] bg-surface p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-text">
          <ReportSummaryText reported={reported} />
        </p>
        {reported.isBanned ? (
          <p className="mt-0.5 text-sm text-destructive">{t("moderation.accountIsBanned")}</p>
        ) : null}
      </div>
      <ReportedUserActions
        reported={reported}
        busy={busyUserId === reported.profile.id}
        onDismiss={() => askDismiss(reported)}
        onBlock={() => askBlock(reported)}
      />
    </div>
  );
}
