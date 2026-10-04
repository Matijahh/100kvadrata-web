"use client";

import { AuthScreen, AuthSubmitButton, authLinkClass } from "@/components/auth/AuthScreen";
import { CodeInput, CodeInputHandle } from "@/components/form/CodeInput";
import { useToast } from "@/components/providers/ToastProvider";
import { EMAIL_OTP_LENGTH } from "@/constants/auth";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const RESEND_COOLDOWN_SECONDS = 60;

// Web port of flatswipe/src/app/(auth)/verify-email.tsx: the signup OTP code,
// a resend with a cooldown, and onboarding once the code is accepted.
export function VerifyEmailForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const resend = searchParams.get("resend");
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendVerificationCode = useAuthStore((state) => state.resendVerificationCode);
  const [code, setCode] = useState("");
  const [hasCodeError, setCodeError] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const codeRef = useRef<CodeInputHandle>(null);
  // The last digit auto-submits, so a click on the button can race the same
  // submission. `isLoading` lands a render too late to stop it.
  const isSubmittingRef = useRef(false);

  const handleVerify = async (submittedCode?: string) => {
    const value = submittedCode ?? code;

    if (isSubmittingRef.current) {
      return;
    }

    if (value.length !== EMAIL_OTP_LENGTH || !email) {
      showToast({ type: "error", message: t("auth.fillAllFields") });
      return;
    }

    isSubmittingRef.current = true;

    try {
      setLoading(true);
      await verifyEmail(email, value);
      router.replace("/onboarding");
    } catch {
      setCode("");
      setCodeError(true);
      showToast({ type: "error", message: t("auth.verifyEmailFailed") });
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) {
      return;
    }

    try {
      setLoading(true);
      await resendVerificationCode(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      showToast({ type: "error", message: t("auth.verifyEmailResendFailed") });
    } finally {
      setLoading(false);
    }
  };

  // Put the cursor back on the cleared boxes after a rejected code, once the
  // field is enabled again.
  useEffect(() => {
    if (hasCodeError && !isLoading) {
      codeRef.current?.focus();
    }
  }, [hasCodeError, isLoading]);

  // Arriving from an unverified login (not straight after registering) means
  // no recent code exists — send one immediately.
  useEffect(() => {
    if (resend === "1" && email) {
      resendVerificationCode(email).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  return (
    <AuthScreen title={t("auth.verifyEmailTitle")}>
      <p className="mb-5 text-[15px] text-text-muted">
        {t("auth.verifyEmailDescription", { email })}
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleVerify();
        }}
      >
        <CodeInput
          ref={codeRef}
          label={t("auth.verifyEmailCodeLabel")}
          value={code}
          length={EMAIL_OTP_LENGTH}
          onChangeText={(next) => {
            setCode(next);
            setCodeError(false);
          }}
          onComplete={handleVerify}
          hasError={hasCodeError}
          editable={!isLoading}
          autoFocus
        />

        <AuthSubmitButton
          label={t("auth.verifyEmailButton")}
          loadingLabel={t("auth.verifyEmailLoading")}
          isLoading={isLoading}
        />
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading || cooldown > 0}
          className={authLinkClass}
        >
          {cooldown > 0
            ? t("auth.verifyEmailResendIn", { seconds: cooldown })
            : t("auth.verifyEmailResend")}
        </button>
      </div>

      <div className="mt-2 text-center">
        <button type="button" onClick={() => router.replace("/login")} className={authLinkClass}>
          {t("auth.backToLogin")}
        </button>
      </div>
    </AuthScreen>
  );
}
