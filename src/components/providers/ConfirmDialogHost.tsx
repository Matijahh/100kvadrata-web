"use client";

import { cn } from "@/lib/cn";
import { useConfirmStore } from "@/utils/confirmAction";
import { AlertDialog } from "radix-ui";
import { useTranslation } from "react-i18next";

// Renders whatever `confirmDestructiveAction` / `promptDestructiveChoice` put in
// the confirm store — the web's version of the app's Alert.alert. Cancel comes
// first and is focused by default, so Enter never confirms by accident.
export function ConfirmDialogHost() {
  const { t } = useTranslation();
  const request = useConfirmStore((state) => state.request);
  const close = useConfirmStore((state) => state.close);

  return (
    <AlertDialog.Root open={!!request} onOpenChange={(open) => !open && close()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/40 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <AlertDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[60] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-3xl bg-surface p-6 text-text shadow-[0_10px_40px_rgba(0,0,0,0.25)]",
            "data-[state=open]:animate-[fade-in_150ms_ease-out]",
          )}
        >
          <AlertDialog.Title className="font-display text-xl">
            {request?.title}
          </AlertDialog.Title>
          {request?.message ? (
            <AlertDialog.Description className="mt-2 text-sm text-text-muted">
              {request.message}
            </AlertDialog.Description>
          ) : (
            <AlertDialog.Description className="sr-only">
              {request?.title}
            </AlertDialog.Description>
          )}
          <div className="mt-6 flex flex-col gap-2">
            {request?.options.map((option) => (
              <AlertDialog.Action
                key={option.label}
                onClick={option.onPress}
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm font-semibold transition-opacity hover:opacity-90",
                  option.destructive
                    ? "bg-destructive text-white"
                    : "bg-surface-muted text-text",
                )}
              >
                {option.label}
              </AlertDialog.Action>
            ))}
            <AlertDialog.Cancel className="min-h-11 rounded-full px-4 text-sm font-semibold text-text-muted hover:bg-surface-muted">
              {t("common.cancel")}
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
