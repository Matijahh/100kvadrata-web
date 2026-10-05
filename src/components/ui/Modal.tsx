"use client";

import CloseIcon from "@assets/icons/close-icon.svg";
import { cn } from "@/lib/cn";
import { Dialog } from "radix-ui";
import { useTranslation } from "react-i18next";

// The web stand-in for the app's bottom sheets: slides up from the bottom on
// phones (like the RN sheets) and becomes a centred dialog from `md` up.
// Radix handles focus trapping, Esc, scroll lock and click-outside — and every
// popup also has a visible X, top right, for people who would never think to
// click the backdrop.

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Visually hide the title (it is still announced to screen readers). */
  hideTitle?: boolean;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Extra classes for the X, e.g. to line it up with pinned content. */
  closeClassName?: string;
};

export function Modal({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  children,
  className,
  closeClassName,
}: ModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <Dialog.Content
          className={cn(
            "fixed z-50 bg-surface text-text shadow-[0_-10px_40px_rgba(0,0,0,0.25)] outline-none",
            // Phone: bottom sheet.
            "inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-[32px] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-3",
            "data-[state=open]:animate-[sheet-up_220ms_ease-out]",
            // Tablet / desktop: centred dialog.
            "md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2",
            "md:rounded-3xl md:p-8 md:data-[state=open]:animate-[fade-in_150ms_ease-out]",
            className,
          )}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-divider md:hidden" aria-hidden />
          {/* Sticky, so it stays in the corner while a tall sheet scrolls;
              floated (or, in a flex column, pushed to the end) with a negative
              bottom margin so it takes no room of its own — the title beside
              it keeps clear with pr-10. */}
          <Dialog.Close
            aria-label={t("web.common.close")}
            title={t("web.common.close")}
            className={cn(
              "sticky top-0 z-10 float-right -mb-10 -mr-2 flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text md:-mr-3",
              closeClassName,
            )}
          >
            <CloseIcon width={22} height={22} aria-hidden />
          </Dialog.Close>
          <Dialog.Title
            className={cn("pr-10 font-display text-2xl text-text", hideTitle && "sr-only")}
          >
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-2 text-sm text-text-muted">
              {description}
            </Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
