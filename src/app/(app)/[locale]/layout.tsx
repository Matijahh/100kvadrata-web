import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { APP_STORE_ID, SITE_ORIGIN } from "@/content/common";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeTokens } from "@/components/providers/ThemeTokens";
import type { AppLanguage } from "@/types/types";
import "./app.css";

// Root layout of the web app. The marketing pages have their own root layout
// in (marketing), so moving between the two is a full page load and neither
// side's CSS can leak into the other.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: "100m²", template: "%s · 100m²" },
  icons: { icon: "/favicon.png" },
  // iOS Safari shows its own "Open in the App Store" banner for the app.
  other: { "apple-itunes-app": `app-id=${APP_STORE_ID}` },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F5" },
    { media: "(prefers-color-scheme: dark)", color: "#101217" },
  ],
};

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeTokens />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={{}}>
          <AppProviders locale={locale as AppLanguage}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
