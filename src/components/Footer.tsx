import { Fragment } from "react";

export type FooterLink = {
  label: string;
  href: string;
  hrefLang?: string;
};

type Props = {
  links: FooterLink[];
  note: string;
};

export function Footer({ links, note }: Props) {
  return (
    <footer className="foot">
      <div className="wrap foot__inner">
        <p className="foot__links">
          {links.map((link, i) => (
            <Fragment key={link.href + link.label}>
              {i > 0 ? <span aria-hidden="true">·</span> : null}
              <a href={link.href} hrefLang={link.hrefLang}>
                {link.label}
              </a>
            </Fragment>
          ))}
        </p>
        <p className="foot__note">{note}</p>
      </div>
    </footer>
  );
}
