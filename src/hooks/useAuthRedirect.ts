"use client";

import { useRouter } from "@/i18n/navigation";
import { sanitizeNextPath } from "@/lib/nextPath";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** The validated `?next=` destination of the current auth screen. */
export function useNextPath() {
  const searchParams = useSearchParams();
  return sanitizeNextPath(searchParams.get("next"));
}

/**
 * Sends someone who is already signed in away from login / register, the way
 * the app's (auth) layout redirects to the feed. Only checks the session the
 * page was opened with: a sign-in that happens on the page navigates on its own
 * (to onboarding, choose-username or `next`), and must not race this redirect.
 */
export function useRedirectIfSignedIn() {
  const router = useRouter();
  const next = useNextPath();
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!isReady || hasChecked.current) {
      return;
    }

    hasChecked.current = true;

    if (isAuthenticated) {
      router.replace(next);
    }
  }, [isReady, isAuthenticated, next, router]);
}
