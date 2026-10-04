"use client";

import Button from "@/components/genericComponents/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { usePathname } from "@/i18n/navigation";
import { submitFeedback } from "@/services/feedback";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

/** Matches the server-side check on `feedback.message`. */
const MAX_MESSAGE_LENGTH = 2000;

/**
 * "Report a problem" — web port of the app's ReportProblemSheet. Same table,
 * same context (route, platform "web", and the deployed commit as the
 * version when Vercel provides it).
 */
export function ReportProblemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const pathname = usePathname();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const inputId = useId();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  const trimmed = message.trim();

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => {
      if (!sessionUser) throw new Error("Cannot submit feedback without an authenticated user.");
      return submitFeedback({
        userId: sessionUser.id,
        message: trimmed,
        appVersion: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
        platform: "web",
        route: pathname ?? null,
      });
    },
    onSuccess: () => {
      onOpenChange(false);
      showToast({ type: "success", message: t("feedback.success") });
    },
    onError: (error) => {
      console.error("Failed to submit feedback", error);
      showToast({ type: "error", message: t("feedback.error") });
    },
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={t("feedback.title")} className="md:max-w-lg">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed && !isPending) send();
        }}
      >
        <label htmlFor={inputId} className="mt-2 block text-sm leading-5 text-text-muted">
          {t("feedback.intro")}
        </label>
        <textarea
          id={inputId}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t("feedback.placeholder")}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={isPending}
          rows={6}
          className="mt-4 w-full resize-y rounded-[25px] border border-transparent bg-surface-muted px-[15px] py-[15px] text-base text-text placeholder:text-placeholder focus:border-primary-soft focus:outline-none disabled:opacity-70"
        />
        <p className="mt-1 text-right text-xs text-text-muted">
          {message.length}/{MAX_MESSAGE_LENGTH}
        </p>
        <Button
          type="submit"
          title={isPending ? t("feedback.sending") : t("feedback.send")}
          disabled={!trimmed || isPending}
          fullWidth
          className="mt-4"
        />
      </form>
    </Modal>
  );
}
