"use client";

import { AuthScreen, AuthSubmitButton } from "@/components/auth/AuthScreen";
import { PasswordField } from "@/components/form/LabeledTextField";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Web port of flatswipe/src/app/(protected)/update-password.tsx. Reached signed
// in — via the reset code, or from settings — so it lives with the auth frame
// but is guarded like any account page.
export function UpdatePasswordForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      showToast({ type: "error", message: t("auth.fillAllFields") });
      return;
    }

    if (password !== confirmPassword) {
      showToast({ type: "error", message: t("auth.passwordsMismatch") });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showToast({ type: "success", message: t("auth.passwordUpdated") });
      router.replace("/feed");
    } catch {
      showToast({ type: "error", message: t("auth.updatePasswordFailed") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title={t("auth.updatePasswordTitle")}>
      <form onSubmit={handleSubmit} noValidate>
        <PasswordField
          label={t("auth.newPasswordLabel")}
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          disabled={isLoading}
          placeholder={t("auth.passwordPlaceholder")}
          autoFocus
        />
        <PasswordField
          label={t("auth.confirmPasswordLabel")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoComplete="new-password"
          disabled={isLoading}
          placeholder={t("auth.passwordPlaceholder")}
        />
        <AuthSubmitButton
          label={t("auth.updatePasswordButton")}
          loadingLabel={t("auth.updatePasswordLoading")}
          isLoading={isLoading}
        />
      </form>
    </AuthScreen>
  );
}
