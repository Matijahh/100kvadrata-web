import { create } from "zustand";

// Platform adapter — same functions and signatures as
// flatswipe/src/utils/confirmAction.ts, which wraps `Alert.alert`. The web has
// no native alert with styled buttons, so a request is put in this store and
// `<ConfirmDialogHost />` (mounted once in the app providers) renders it.
//
// The rules carry over from the app: Cancel is always offered and always safe,
// and dismissing the dialog (Esc, click outside) leaves everything as it was.

type DestructiveChoice = {
  label: string;
  onPress: () => void;
  /** Rendered in the destructive colour. Off for the milder option in a menu. */
  destructive?: boolean;
};

export type ConfirmRequest = {
  title: string;
  message?: string;
  options: DestructiveChoice[];
};

type ConfirmStore = {
  request: ConfirmRequest | null;
  open: (request: ConfirmRequest) => void;
  close: () => void;
};

export const useConfirmStore = create<ConfirmStore>((set) => ({
  request: null,
  open: (request) => set({ request }),
  close: () => set({ request: null }),
}));

export const confirmDestructiveAction = ({
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
}) => {
  useConfirmStore.getState().open({
    title,
    message,
    options: [{ label: confirmLabel, onPress: onConfirm, destructive: true }],
  });
};

export const promptDestructiveChoice = ({
  title,
  message,
  options,
}: {
  title: string;
  message?: string;
  options: DestructiveChoice[];
}) => {
  useConfirmStore.getState().open({ title, message, options });
};
