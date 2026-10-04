"use client";

import Button from "@/components/genericComponents/Button";
import { Modal } from "@/components/ui/Modal";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSignInPromptStore } from "@/stores/useSignInPromptStore";
import { useTranslation } from "react-i18next";

// Web counterpart of the app's SignInPromptSheet. Guests keep browsing; an
// account-only action opens this instead, explaining why an account is needed.
// Signing in brings them back to the page they were on.
export function SignInPromptDialog() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = useSignInPromptStore((state) => state.isOpen);
  const reason = useSignInPromptStore((state) => state.reason);
  const dismiss = useSignInPromptStore((state) => state.dismiss);

  const go = (route: "/login" | "/register") => {
    dismiss();
    router.push(`${route}?next=${encodeURIComponent(pathname)}`);
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && dismiss()}
      title={t("signInPrompt.title")}
      description={t(`signInPrompt.reason.${reason}`)}
    >
      <div className="mt-6 flex flex-col items-stretch gap-3">
        <Button title={t("signInPrompt.createAccount")} fullWidth onClick={() => go("/register")} />
        <Button
          title={t("signInPrompt.signIn")}
          variant="secondary"
          fullWidth
          className="normal-case"
          onClick={() => go("/login")}
        />
        <button
          type="button"
          onClick={dismiss}
          className="mt-1 py-2 text-sm text-text-muted hover:text-text"
        >
          {t("signInPrompt.keepBrowsing")}
        </button>
      </div>
    </Modal>
  );
}
