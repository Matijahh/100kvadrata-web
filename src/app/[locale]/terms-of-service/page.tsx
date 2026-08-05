import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { CONTACT_EMAIL, chrome, withLocale } from "@/content/common";
import { terms } from "@/content/legal";
import { Footer, type FooterLink } from "@/components/Footer";
import { Masthead } from "@/components/Masthead";

const PATH = "/terms-of-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const doc = terms[locale];
  return {
    title: doc.title,
    description: doc.description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: withLocale(locale, PATH),
      languages: { sr: PATH, en: `/en${PATH}` },
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const c = chrome[locale];
  const doc = terms[locale];
  const other: Locale = locale === "sr" ? "en" : "sr";

  const footerLinks: FooterLink[] = [
    { label: c.labels.home, href: withLocale(locale, "/") },
    { label: c.labels.privacy, href: withLocale(locale, "/privacy-policy") },
    { label: c.labels.contact, href: `mailto:${CONTACT_EMAIL}` },
    { label: c.labels.otherLang, href: withLocale(other, PATH), hrefLang: other },
  ];

  return (
    <>
      <a className="skip" href="#main">
        {c.skip}
      </a>

      <Masthead locale={locale} path={PATH} />

      <main id="main" className="wrap legal">
        <h1>{doc.h1}</h1>
        {doc.body}
      </main>

      <Footer links={footerLinks} note={c.footNote} />
    </>
  );
}
