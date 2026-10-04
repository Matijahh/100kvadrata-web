"use client";

import { AuthScreen, AuthSubmitButton, authLinkClass } from "@/components/auth/AuthScreen";
import { ContinueAsGuestLink } from "@/components/auth/ContinueAsGuestLink";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { LabeledTextField, PasswordField } from "@/components/form/LabeledTextField";
import { useToast } from "@/components/providers/ToastProvider";
import { useNextPath, useRedirectIfSignedIn } from "@/hooks/useAuthRedirect";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/useAuthStore";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Web port of flatswipe/src/app/(auth)/register.tsx, including the explicit
// terms acceptance the app requires before an account can be created.
export function RegisterForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const next = useNextPath();
  const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  useRedirectIfSignedIn();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !password || !trimmedUsername) {
      showToast({ type: "error", message: t("auth.fillAllFields") });
      return;
    }

    if (!hasAcceptedTerms) {
      showToast({ type: "error", message: t("auth.eulaRequired") });
      return;
    }

    try {
      setLoading(true);
      const { needsVerification } = await register(trimmedEmail, password, trimmedUsername);

      if (needsVerification) {
        router.push(`/verify-email?${new URLSearchParams({ email: trimmedEmail })}`);
        return;
      }

      router.replace("/onboarding");
    } catch (error) {
      console.error("Register error:", error);
      const message =
        (error as Error)?.message === "username_already_taken"
          ? t("auth.usernameTaken")
          : (error as Error)?.message === "User already registered"
            ? t("auth.userAlreadyRegistered")
            : t("auth.registerFailed");
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const nextQuery = next === "/feed" ? "" : `?next=${encodeURIComponent(next)}`;

  return (
    <AuthScreen title={t("auth.registerWelcome")}>
      <form onSubmit={handleRegister} noValidate>
        <LabeledTextField
          label={t("auth.usernameLabel")}
          value={username}
          onChangeText={setUsername}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          disabled={isLoading}
          placeholder={t("auth.usernamePlaceholder")}
        />

        <LabeledTextField
          label={t("auth.emailLabel")}
          value={email}
          onChangeText={setEmail}
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          disabled={isLoading}
          placeholder={t("auth.emailPlaceholder")}
        />

        <PasswordField
          label={t("auth.passwordLabel")}
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          disabled={isLoading}
          placeholder={t("auth.passwordPlaceholder")}
        />

        {/* Above the button it gates, so a top-down reader meets the consent
            before the action that depends on it. */}
        <label className="mt-1.5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={hasAcceptedTerms}
            onChange={(event) => setHasAcceptedTerms(event.target.checked)}
            disabled={isLoading}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cn(
              "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 border-primary text-xs font-bold",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
              hasAcceptedTerms ? "bg-primary text-text-on-primary" : "bg-transparent",
            )}
          >
            {hasAcceptedTerms ? "✓" : null}
          </span>
          <span className="text-[13px] leading-[19px] text-text-muted">
            {t("auth.eulaPrefix")}
            <Link href="/terms-of-service" target="_blank" className="font-semibold text-primary underline">
              {t("auth.legalConsentTerms")}
            </Link>
            {t("auth.legalConsentAnd")}
            <Link href="/privacy-policy" target="_blank" className="font-semibold text-primary underline">
              {t("auth.legalConsentPrivacy")}
            </Link>
            {t("auth.eulaSuffix")}
          </span>
        </label>

        {/* Not disabled while the terms are unchecked: a grey button cannot say
            what is missing; pressing this one does. */}
        <AuthSubmitButton
          label={t("auth.registerButton")}
          loadingLabel={t("auth.registerLoading")}
          isLoading={isLoading}
        />
      </form>

      <SocialAuthButtons
        disabled={isLoading}
        next={next}
        onBeforeAuth={() => {
          if (!hasAcceptedTerms) {
            showToast({ type: "error", message: t("auth.eulaRequired") });
            return false;
          }
          return true;
        }}
      />

      <p className="mt-4 text-center text-sm text-primary">
        {t("auth.alreadyHaveAccount")}
        <Link href={`/login${nextQuery}`} className={authLinkClass}>
          {t("auth.loginHere")}
        </Link>
      </p>

      <ContinueAsGuestLink />
    </AuthScreen>
  );
}
