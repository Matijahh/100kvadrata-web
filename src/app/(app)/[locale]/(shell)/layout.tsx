import { AppShell } from "@/components/shell/AppShell";
import { GetAppCard } from "@/components/shell/GetAppCard";
import type { AppLanguage } from "@/types/types";

// Pages with the app's navigation (feed, listing, messages, profile, ...).
// Auth screens live in (auth) and render without it.
export default async function ShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell getAppCard={<GetAppCard locale={locale as AppLanguage} />}>
      {children}
    </AppShell>
  );
}
