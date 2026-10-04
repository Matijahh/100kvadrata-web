import type { Locale } from "@/i18n/routing";
import { chrome, withLocale } from "@/content/common";
import { Logo } from "./Logo";

type Props = {
  locale: Locale;
  /** Root-relative path of the current page ("/" for home), used to build the
      SR/EN switch targets. */
  path: string;
  /** Show the reading-progress hairline (landing page only). */
  progress?: boolean;
};

export function Masthead({ locale, path, progress = false }: Props) {
  const c = chrome[locale];
  const homeHref = withLocale(locale, "/");
  const srHref = withLocale("sr", path);
  const enHref = withLocale("en", path);

  return (
    <header className="masthead">
      <div className="wrap masthead__inner">
        <a className="mark" href={homeHref} aria-label={c.homeAria}>
          <Logo />
        </a>

        <nav className="langswitch" aria-label={c.langAria}>
          <a
            href={srHref}
            hrefLang="sr"
            aria-current={locale === "sr" ? "true" : undefined}
          >
            SR
          </a>
          <span aria-hidden="true">/</span>
          <a
            href={enHref}
            hrefLang="en"
            aria-current={locale === "en" ? "true" : undefined}
          >
            EN
          </a>
        </nav>
      </div>
      {progress ? (
        <span className="masthead__progress" aria-hidden="true" />
      ) : null}
    </header>
  );
}
