"use client";

import { SessionGuard } from "@/components/auth/SessionGuard";
import { AuthSessionSync } from "@/components/providers/AuthSessionSync";
import { ConfirmDialogHost } from "@/components/providers/ConfirmDialogHost";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ProfilePreferencesSync } from "@/components/providers/ProfilePreferencesSync";
import { ThemeSync } from "@/components/providers/ThemeSync";
import { ToastProvider } from "@/components/providers/ToastProvider";
import type { AppLanguage } from "@/types/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";

// Everything the app's root layout layers (src/app/_layout.tsx in flatswipe),
// minus what has no web counterpart (safe area, push notifications, splash).
export function AppProviders({
  locale,
  children,
}: {
  locale: AppLanguage;
  children: React.ReactNode;
}) {
  // One client per browser tab; created in state so it survives re-renders but
  // is never shared between requests on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider locale={locale}>
        <ToastProvider>
          <AuthSessionSync />
          <SessionGuard />
          <ThemeSync />
          <Suspense fallback={null}>
            <ProfilePreferencesSync />
          </Suspense>
          {children}
          <ConfirmDialogHost />
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
