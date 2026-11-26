"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import { LabeledTextField } from "@/components/form/LabeledTextField";
import Button from "@/components/genericComponents/Button";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/queryKeys";
import {
  ADMIN_NOTIFICATION_BODY_MAX,
  ADMIN_NOTIFICATION_TITLE_MAX,
  sendAdminNotification,
} from "@/services/notifications";
import { confirmDestructiveAction } from "@/utils/confirmAction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Admin-only (FEAT-42): one in-app notification to every user, no push.
 * Reached from the notifications page. The database function refuses anyone who
 * isn't an admin, so hiding this page is not the only guard.
 */
export function AdminNotificationForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bodyId = useId();
  const { currentUser, isLoadingProfile } = useCurrentUser();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const isAdmin = currentUser?.isAdmin === true;

  useEffect(() => {
    if (!isLoadingProfile && currentUser && !isAdmin) router.replace("/profile");
  }, [currentUser, isAdmin, isLoadingProfile, router]);

  const sendMutation = useMutation({
    mutationFn: () => sendAdminNotification(title.trim(), body.trim()),
    onSuccess: () => {
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications(currentUser.id) });
      }
      showToast({ type: "success", message: t("admin.notificationSent") });
      setTitle("");
      setBody("");
      router.push("/profile?section=adminPosts");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "";
      showToast({
        type: "error",
        message: message.includes("NOT_ADMIN") ? t("admin.notAdmin") : t("admin.notificationSendError"),
      });
    },
  });

  if (isLoadingProfile || !isAdmin) return <Spinner className="py-24" />;

  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const isSending = sendMutation.isPending;

  const handleSend = () => {
    if (!trimmedTitle) {
      showToast({ type: "error", message: t("admin.notificationTitleRequired") });
      return;
    }
    if (!trimmedBody) {
      showToast({ type: "error", message: t("admin.notificationBodyRequired") });
      return;
    }
    confirmDestructiveAction({
      title: t("admin.notificationConfirmTitle"),
      message: t("admin.notificationConfirmMessage"),
      confirmLabel: t("admin.notificationConfirm"),
      onConfirm: () => sendMutation.mutate(),
    });
  };

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/profile");
  };

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-4 md:px-8 md:pt-8">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("web.listing.back")}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text hover:bg-surface"
        >
          <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
        </button>
        <h1 className="flex-1 font-display text-2xl text-text">{t("admin.sendNotification")}</h1>
      </div>

      <div className="rounded-[32px] bg-surface p-5 md:p-8">
        <LabeledTextField
          label={t("admin.notificationTitleLabel")}
          placeholder={t("admin.notificationTitlePlaceholder")}
          value={title}
          onChangeText={setTitle}
          maxLength={ADMIN_NOTIFICATION_TITLE_MAX}
          disabled={isSending}
        />
        <label htmlFor={bodyId} className="mb-1.5 block text-sm font-light text-form-label">
          {t("admin.notificationBodyLabel")}
        </label>
        <textarea
          id={bodyId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("admin.notificationBodyPlaceholder")}
          maxLength={ADMIN_NOTIFICATION_BODY_MAX}
          rows={6}
          disabled={isSending}
          className="min-h-[140px] w-full resize-y rounded-[20px] bg-surface-muted px-[15px] py-3.5 text-base leading-[22px] text-text placeholder:text-placeholder focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
        />
        <div className="mt-6 flex justify-end">
          <Button
            title={isSending ? t("admin.notificationSending") : t("admin.notificationSend")}
            onClick={handleSend}
            disabled={isSending || !trimmedTitle || !trimmedBody}
            fullWidth
            className="md:w-auto"
          />
        </div>
      </div>
    </div>
  );
}
