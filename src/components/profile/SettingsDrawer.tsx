"use client";

import CloseIcon from "@assets/icons/close-icon.svg";
import { useToast } from "@/components/providers/ToastProvider";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { updateProfilePreferences } from "@/services/profile";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useThemeStore } from "@/stores/useThemeStore";
import type { AppLanguage, AppThemePreference, Profile } from "@/types/types";
import { confirmDestructiveAction } from "@/utils/confirmAction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { useTranslation } from "react-i18next";

/**
 * The app's profile drawer: language, theme, legal pages, logout and account
 * deletion. Language and theme are saved to the profile too, so they follow the
 * user between the app and the web.
 */
export function SettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const language = useLanguageStore((state) => state.language);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const preferencesMutation = useMutation({
    mutationFn: (input: { preferredLanguage?: AppLanguage; preferredTheme?: AppThemePreference }) =>
      updateProfilePreferences(sessionUser!.id, input),
    onSuccess: (_data, input) => {
      if (!sessionUser) return;
      queryClient.setQueryData<Profile>(queryKeys.profile(sessionUser.id), (current) =>
        current
          ? {
              ...current,
              preferredLanguage: input.preferredLanguage ?? current.preferredLanguage,
              preferredTheme: input.preferredTheme ?? current.preferredTheme,
            }
          : current,
      );
    },
    onError: () => showToast({ type: "error", message: t("profile.preferencesSaveFailed") }),
  });

  const selectLanguage = (next: AppLanguage) => {
    if (next === language) return;
    if (sessionUser) preferencesMutation.mutate({ preferredLanguage: next });
    // The URL is the language on the web.
    router.replace(pathname, { locale: next });
  };

  const selectTheme = (next: AppThemePreference) => {
    const previous = theme;
    setTheme(next);
    if (sessionUser) {
      preferencesMutation.mutate(
        { preferredTheme: next },
        { onError: () => setTheme(previous) },
      );
    }
  };

  const handleLogout = () => {
    onOpenChange(false);
    confirmDestructiveAction({
      title: t("profile.logoutTitle"),
      message: t("profile.logoutMessage"),
      confirmLabel: t("profile.logout"),
      onConfirm: async () => {
        await logout();
        router.replace("/feed");
      },
    });
  };

  const handleDeleteAccount = () => {
    onOpenChange(false);
    confirmDestructiveAction({
      title: t("profile.deleteAccountTitle"),
      message: t("profile.deleteAccountMessage"),
      confirmLabel: t("profile.deleteAccountConfirm"),
      onConfirm: async () => {
        try {
          await deleteAccount();
          router.replace("/feed");
        } catch {
          showToast({ type: "error", message: t("profile.deleteAccountFailed") });
        }
      },
    });
  };

  const languages: { value: AppLanguage; label: string }[] = [
    { value: "sr", label: t("profile.serbian") },
    { value: "en", label: t("profile.english") },
  ];
  const themes: { value: AppThemePreference; label: string }[] = [
    { value: "light", label: t("profile.themeLight") },
    { value: "dark", label: t("profile.themeDark") },
    { value: "system", label: t("profile.themeSystem") },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(340px,88vw)] flex-col gap-6 overflow-y-auto bg-surface p-6 shadow-[-10px_0_40px_rgba(0,0,0,0.2)] outline-none data-[state=open]:animate-[drawer-in_220ms_cubic-bezier(0.33,1,0.68,1)]">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-2xl text-text">{t("profile.title")}</Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 text-text hover:bg-surface-muted" aria-label={t("common.done")}>
              <CloseIcon width={22} height={22} aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{t("profile.title")}</Dialog.Description>

          <OptionGroup
            title={t("profile.languageTitle")}
            options={languages}
            value={language}
            onSelect={selectLanguage}
          />
          <OptionGroup title={t("profile.themeTitle")} options={themes} value={theme} onSelect={selectTheme} />

          <nav className="flex flex-col border-t border-divider pt-4">
            {/* Marketing pages: a different root layout, so plain links (full page load). */}
            <a href={language === "en" ? "/en/privacy-policy" : "/privacy-policy"} className="py-2.5 text-base text-text hover:text-primary">
              {t("profile.privacyPolicy")}
            </a>
            <a href={language === "en" ? "/en/terms-of-service" : "/terms-of-service"} className="py-2.5 text-base text-text hover:text-primary">
              {t("profile.termsOfService")}
            </a>
          </nav>

          <div className="mt-auto flex flex-col gap-1 border-t border-divider pt-4">
            <button type="button" onClick={handleLogout} className="py-2.5 text-left text-base font-semibold text-text hover:text-primary">
              {t("profile.logout")}
            </button>
            <button type="button" onClick={handleDeleteAccount} className="py-2.5 text-left text-sm text-destructive hover:underline">
              {t("profile.deleteAccount")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function OptionGroup<T extends string>({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">{title}</legend>
      <div className="flex rounded-full bg-surface-muted p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onSelect(option.value)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
              option.value === value ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
