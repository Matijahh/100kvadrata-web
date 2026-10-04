"use client";

import { AuthScreen, AuthSubmitButton, authLinkClass } from "@/components/auth/AuthScreen";
import { CodeInput, CodeInputHandle } from "@/components/form/CodeInput";
import { LabeledTextField } from "@/components/form/LabeledTextField";
import { useToast } from "@/components/providers/ToastProvider";
import { EMAIL_OTP_LENGTH } from "@/constants/auth";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Web port of flatswipe/src/app/(auth)/forgot-password.tsx. A one-time code
// signs the user in (no reset link), then they choose a new password on
// /update-password — the same Supabase calls as the app, so the emails match.
export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [hasCodeError, setCodeError] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const [isLoading, setLoading] = useState(false);
  const codeRef = useRef<CodeInputHandle>(null);
  const isSubmittingRef = useRef(false);

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showToast({ type: "error", message: t("auth.fillAllFields") });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setStep("code");
    } catch {
      showToast({ type: "error", message: t("auth.forgotPasswordFailed") });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (submittedCode?: string) => {
    const value = submittedCode ?? code;

    if (isSubmittingRef.current) {
      return;
    }

    if (value.length !== EMAIL_OTP_LENGTH) {
      showToast({ type: "error", message: t("auth.fillAllFields") });
      return;
    }

    isSubmittingRef.current = true;

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: value,
        type: "email",
      });
      if (error) throw error;
      router.replace("/update-password");
    } catch {
      setCode("");
      setCodeError(true);
      showToast({ type: "error", message: t("auth.invalidResetCode") });
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasCodeError && !isLoading) {
      codeRef.current?.focus();
    }
  }, [hasCodeError, isLoading]);

  return (
    <AuthScreen title={t("auth.forgotPasswordTitle")}>
      {step === "email" ? (
        <>
          <p className="mb-5 text-[15px] text-text-muted">{t("auth.forgotPasswordDescription")}</p>
          <form onSubmit={handleSendCode} noValidate>
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
              autoFocus
            />
            <AuthSubmitButton
              label={t("auth.forgotPasswordButton")}
              loadingLabel={t("auth.forgotPasswordLoading")}
              isLoading={isLoading}
            />
          </form>
          <div className="mt-4 text-center">
            <button type="button" onClick={() => router.replace("/login")} className={authLinkClass}>
              {t("auth.backToLogin")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-5 text-[15px] text-text-muted">
            {t("auth.forgotPasswordCodeDescription")}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleVerifyCode();
            }}
          >
            <CodeInput
              ref={codeRef}
              label={t("auth.resetCodeLabel")}
              value={code}
              length={EMAIL_OTP_LENGTH}
              onChangeText={(next) => {
                setCode(next);
                setCodeError(false);
              }}
              onComplete={handleVerifyCode}
              hasError={hasCodeError}
              editable={!isLoading}
              autoFocus
            />
            <AuthSubmitButton
              label={t("auth.verifyCodeButton")}
              loadingLabel={t("auth.forgotPasswordLoading")}
              isLoading={isLoading}
            />
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setCodeError(false);
              }}
              className={authLinkClass}
            >
              {t("auth.resendCode")}
            </button>
          </div>
        </>
      )}
    </AuthScreen>
  );
}
