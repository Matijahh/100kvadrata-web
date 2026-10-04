"use client";

import { AuthScreen, AuthSubmitButton, authLinkClass } from "@/components/auth/AuthScreen";
import { ContinueAsGuestLink } from "@/components/auth/ContinueAsGuestLink";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { LabeledTextField, PasswordField } from "@/components/form/LabeledTextField";
import { useToast } from "@/components/providers/ToastProvider";
import { useNextPath, useRedirectIfSignedIn } from "@/hooks/useAuthRedirect";
import { Link, useRouter } from "@/i18n/navigation";
import { UnconfirmedEmailError, useAuthStore } from "@/stores/useAuthStore";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Web port of flatswipe/src/app/(auth)/login.tsx.
export function LoginForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useNextPath();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setLoading] = useState(false);

  useRedirectIfSignedIn();

  // /auth/callback sends failed social sign-ins back here.
  const oauthError = searchParams.get("error");
  useEffect(() => {
    if (oauthError) {
      showToast({ type: "error", message: t("auth.socialLoginFailed") });
    }
  }, [oauthError, showToast, t]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      showToast({ type: "error", message: t("auth.fillAllFields") });
      return;
    }

    if (!trimmedEmail.includes("@")) {
      showToast({ type: "error", message: t("auth.invalidEmail") });
      return;
    }

    try {
      setLoading(true);
      await login(trimmedEmail, password);
      router.replace(next);
    } catch (error) {
      console.error("Login error:", error);

      if ((error as Error)?.message === "email_not_confirmed") {
        const params = new URLSearchParams({
          email: (error as UnconfirmedEmailError).email,
          resend: "1",
        });
        router.push(`/verify-email?${params}`);
        return;
      }

      showToast({ type: "error", message: t("auth.loginFailed") });
    } finally {
      setLoading(false);
    }
  };

  const nextQuery = next === "/feed" ? "" : `?next=${encodeURIComponent(next)}`;

  return (
    <AuthScreen title={t("auth.loginWelcome")}>
      <form onSubmit={handleLogin} noValidate>
        <LabeledTextField
          label={t("auth.loginIdentifierLabel")}
          value={email}
          onChangeText={setEmail}
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          disabled={isLoading}
          placeholder={t("auth.loginIdentifierPlaceholder")}
        />

        <PasswordField
          label={t("auth.passwordLabel")}
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          disabled={isLoading}
          placeholder={t("auth.passwordPlaceholder")}
        />

        <AuthSubmitButton
          label={t("auth.loginButton")}
          loadingLabel={t("auth.loginLoading")}
          isLoading={isLoading}
        />
      </form>

      <div className="mt-3 text-center">
        <Link href="/forgot-password" className={authLinkClass}>
          {t("auth.forgotPassword")}
        </Link>
      </div>

      <SocialAuthButtons disabled={isLoading} next={next} />

      <p className="mt-4 text-center text-sm text-primary">
        {t("auth.noProfile")}
        <Link href={`/register${nextQuery}`} className={authLinkClass}>
          {t("auth.registerHere")}
        </Link>
      </p>

      <ContinueAsGuestLink />
    </AuthScreen>
  );
}
