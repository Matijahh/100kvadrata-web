import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { CONTACT_EMAIL, chrome, withLocale } from "@/content/common";
import { listing } from "@/content/listing";
import { Footer, type FooterLink } from "@/components/Footer";
import { Masthead } from "@/components/Masthead";
import { StoreBadges } from "@/components/StoreBadges";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = listing[locale].meta;
  const path = `/listing/${id}`;
  return {
    title: c.title,
    description: c.description,
    robots: { index: false, follow: false },
    alternates: {
      languages: { sr: path, en: `/en${path}` },
    },
    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      type: "website",
      locale: c.ogLocale,
      images: ["/favicon.png"],
    },
  };
}

export default async function ListingFallbackPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = raw as Locale;
  const c = chrome[locale];
  const t = listing[locale];
  const other: Locale = locale === "sr" ? "en" : "sr";
  const path = `/listing/${id}`;

  const footerLinks: FooterLink[] = [
    { label: c.labels.home, href: withLocale(locale, "/") },
    { label: c.labels.terms, href: withLocale(locale, "/terms-of-service") },
    { label: c.labels.contact, href: `mailto:${CONTACT_EMAIL}` },
    { label: c.labels.otherLang, href: withLocale(other, path), hrefLang: other },
  ];

  return (
    <>
      <a className="skip" href="#main">
        {c.skip}
      </a>

      <Masthead locale={locale} path={path} />

      <main id="main" className="wrap legal">
        <h1>{t.h1}</h1>
        <p className="lede">{t.lede}</p>

        <StoreBadges labels={c.stores} />

        <p>
          {/* Lets an app-user who lands here jump straight into the app; a
              harmless no-op for everyone else. */}
          <a href={`stokvadrata://listing/${id}`}>{t.openApp}</a>
        </p>
      </main>

      <Footer links={footerLinks} note={c.footNote} />
    </>
  );
}
