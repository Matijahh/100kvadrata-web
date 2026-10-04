// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { create } from "zustand";

// Which account-only action the guest tried to use. Drives the copy shown in
// the sign-in sheet so the prompt explains why an account is needed.
export type SignInPromptReason =
  | "like"
  | "save"
  | "message"
  | "newListing"
  | "inbox"
  | "profile"
  | "savedSearch"
  | "report"
  | "generic";

type SignInPromptStore = {
  isOpen: boolean;
  reason: SignInPromptReason;
  promptSignIn: (reason?: SignInPromptReason) => void;
  dismiss: () => void;
};

// Deliberately not persisted — this is transient UI state.
export const useSignInPromptStore = create<SignInPromptStore>((set) => ({
  isOpen: false,
  reason: "generic",
  promptSignIn: (reason = "generic") => set({ isOpen: true, reason }),
  dismiss: () => set({ isOpen: false }),
}));
