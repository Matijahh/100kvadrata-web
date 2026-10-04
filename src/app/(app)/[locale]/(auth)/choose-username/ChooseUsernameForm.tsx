"use client";

import { AuthScreen, AuthSubmitButton } from "@/components/auth/AuthScreen";
import { LabeledTextField } from "@/components/form/LabeledTextField";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { setUsername } from "@/services/socialAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Web port of flatswipe/src/app/(protected)/choose-username.tsx. Social
// sign-ups arrive without a username (the profile trigger allows that); the
// OAuth callback sends them here, then on to onboarding like the app.
export function ChooseUsernameForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const [username, setUsernameValue] = useState("");
  const [isLoading, setLoading] = useState(false);

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = username.trim();

    if (!trimmed) {
      showToast({ type: "error", message: t("auth.fillAllFields") });
      return;
    }

    try {
      setLoading(true);
      await setUsername(trimmed);
      if (sessionUser) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.profile(sessionUser.id) });
      }
      router.replace("/onboarding");
    } catch (error) {
      console.error("Set username error:", error);
      const message =
        (error as Error)?.message === "username_already_taken"
          ? t("auth.usernameTaken")
          : t("auth.chooseUsernameFailed");
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title={t("auth.chooseUsernameTitle")}>
      <p className="mb-6 text-[15px] text-text-muted">{t("auth.chooseUsernameDescription")}</p>
      <form onSubmit={handleContinue} noValidate>
        <LabeledTextField
          label={t("auth.usernameLabel")}
          value={username}
          onChangeText={setUsernameValue}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          disabled={isLoading}
          placeholder={t("auth.usernamePlaceholder")}
          autoFocus
        />
        <AuthSubmitButton
          label={t("auth.chooseUsernameButton")}
          loadingLabel={t("auth.chooseUsernameLoading")}
          isLoading={isLoading}
        />
      </form>
    </AuthScreen>
  );
}
