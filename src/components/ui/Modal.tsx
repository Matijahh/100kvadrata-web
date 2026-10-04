"use client";

import { cn } from "@/lib/cn";
import { Dialog } from "radix-ui";

// The web stand-in for the app's bottom sheets: slides up from the bottom on
// phones (like the RN sheets) and becomes a centred dialog from `md` up.
// Radix handles focus trapping, Esc, scroll lock and click-outside.

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Visually hide the title (it is still announced to screen readers). */
  hideTitle?: boolean;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  children,
  className,
}: ModalProps) {
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
          <Dialog.Title
            className={cn("font-display text-2xl text-text", hideTitle && "sr-only")}
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
