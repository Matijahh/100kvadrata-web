import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { CONTACT_EMAIL, chrome, withLocale } from "@/content/common";
import { BUYER_ARC, OWNER_ARC, landing } from "@/content/landing";
import { Footer, type FooterLink } from "@/components/Footer";
import { Intro } from "@/components/Intro";
import { Masthead } from "@/components/Masthead";
import { PhoneChat } from "@/components/PhoneChat";
import { PhoneFeed } from "@/components/PhoneFeed";
import { PhoneInbox } from "@/components/PhoneInbox";
import { SiteEffects } from "@/components/SiteEffects";
import { Steps } from "@/components/Steps";
import { StoreBadges } from "@/components/StoreBadges";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = landing[locale].meta;
  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical: withLocale(locale, "/"),
      languages: { sr: "/", en: "/en" },
    },
    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      type: "website",
      locale: c.ogLocale,
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = landing[locale];
  const c = chrome[locale];
  const other: Locale = locale === "sr" ? "en" : "sr";

  const footerLinks: FooterLink[] = [
    { label: c.labels.privacy, href: withLocale(locale, "/privacy-policy") },
    { label: c.labels.terms, href: withLocale(locale, "/terms-of-service") },
    { label: c.labels.contact, href: `mailto:${CONTACT_EMAIL}` },
    { label: c.labels.otherLang, href: withLocale(other, "/"), hrefLang: other },
  ];

  return (
    <>
      <Intro />

      <a className="skip" href="#main">
        {c.skip}
      </a>

      <Masthead locale={locale} path="/" progress />

      <main id="main">
        {/* ------------------------------------------------------ hero --- */}
        <section className="hero">
          <div className="hero__glow" aria-hidden="true" />
          <div className="wrap hero__grid">
            <div>
              <p className="eyebrow stage stage--1">{t.hero.eyebrow}</p>

              <h1>
                <span className="line">
                  <i>{t.hero.h1Lines[0]}</i>
                </span>
                <span className="line">
                  <i>{t.hero.h1Lines[1]}</i>
                </span>
                <span className="line">
                  <i>{t.hero.h1Lines[2]}</i>
                </span>
              </h1>

              <p className="hero__sub stage stage--1">{t.hero.sub}</p>

              <p className="lede hero__lede stage stage--2">{t.hero.lede}</p>

              <StoreBadges labels={c.stores} className="stage stage--3" />
            </div>

            {/* the signature: the mechanic itself, not a picture of it */}
            <div className="stage stage--4">
              <PhoneFeed
                reels={t.reels}
                moreLabel={t.feed.moreLabel}
                search={t.feed.search}
                tabsLeft={t.feed.tabsLeft}
                tabsRight={t.feed.tabsRight}
                deck
                deckAria={t.feed.deckAria}
              />
              <p className="reels__hint">{t.feed.hint}</p>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- pitch --- */}
        <section className="band band--deep pitch">
          <div className="wrap reveal">
            <p className="eyebrow">{t.pitch.eyebrow}</p>
            <h2>
              {t.pitch.h2Before}
              <em>{t.pitch.h2Em}</em>
              {t.pitch.h2After}
            </h2>
            <p className="lede">{t.pitch.lede}</p>
          </div>
        </section>

        {/* ------------------------------------------------ buyer steps --- */}
        <Steps head={t.buyer.head} steps={t.buyer.steps} arc={BUYER_ARC} />

        {/* ------------------------------------------------ owner steps --- */}
        <Steps head={t.owner.head} steps={t.owner.steps} arc={OWNER_ARC} flip />

        {/* --------------------------------------------------- screens --- */}
        <section className="band">
          <div className="wrap reveal">
            <p className="eyebrow">{t.gallery.eyebrow}</p>
            <h2>{t.gallery.h2}</h2>

            <div className="screens">
              <PhoneFeed
                reels={[t.reels[1]]}
                moreLabel={t.feed.moreLabel}
                search={t.feed.search}
                tabsLeft={t.feed.tabsLeft}
                tabsRight={t.feed.tabsRight}
              />
              <PhoneInbox title={t.gallery.screenTitle} />
              <PhoneChat
                name={t.gallery.chatName}
                bubbles={t.gallery.chatBubbles}
                field={t.gallery.chatField}
              />
            </div>
            <p className="screen-note">{t.gallery.note}</p>
          </div>
        </section>

        {/* ------------------------------------------------------ last --- */}
        <section className="band band--deep last">
          <div className="wrap reveal">
            <p className="eyebrow">{t.last.eyebrow}</p>
            <h2>{t.last.h2}</h2>
            <p className="lede">{t.last.lede}</p>

            <StoreBadges labels={c.stores} />
          </div>
        </section>
      </main>

      <Footer links={footerLinks} note={c.footNote} />

      <SiteEffects />
    </>
  );
}
