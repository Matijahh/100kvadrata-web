"use client";

import GlobeIcon from "@assets/icons/globe-icon.svg";
import PhoneIcon from "@assets/icons/phone-icon.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { cn } from "@/lib/cn";
import type { Profile } from "@/types/types";
import { promptDestructiveChoice } from "@/utils/confirmAction";
import { normalizeExternalUrl } from "@/utils/externalLinks";
import { useState, type FC, type SVGProps } from "react";
import { useTranslation } from "react-i18next";

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15V9l5.7 3-5.7 3Z" />
    </svg>
  );
}

/**
 * Who someone is: avatar, name, handle, bio, agency and city, and the contact
 * links they chose to publish. Web counterpart of the app's ProfileCard, shared
 * by your own profile and everybody else's.
 */
export function ProfileCard({
  user,
  isLoading = false,
  action,
}: {
  user: Profile | null;
  isLoading?: boolean;
  /** The one button on the card ("Edit profile", "Offer property"). */
  action?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [isBioExpanded, setBioExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[32px] bg-surface p-6 md:flex-row">
        <span className="h-[120px] w-[120px] rounded-full bg-surface-muted" />
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const affiliation = [user?.agencyName, user?.city]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");

  // A website is a URL a stranger typed, so leaving is a deliberate step.
  const openWebsite = (url: string) => {
    const normalized = normalizeExternalUrl(url);
    promptDestructiveChoice({
      title: t("profile.externalLinkTitle"),
      message: t("profile.externalLinkMessage", { url: normalized }),
      options: [
        {
          label: t("profile.externalLinkOpen"),
          onPress: () => window.open(normalized, "_blank", "noopener,noreferrer"),
        },
      ],
    });
  };

  const links: { key: string; icon: FC<SVGProps<SVGSVGElement>>; label: string; href?: string; onClick?: () => void }[] = [];
  // Gated on the flag: your own profile carries your real number even while
  // private, and showing it here would suggest everyone can see it.
  if (user?.phonePublic && user.phone) {
    links.push({ key: "phone", icon: PhoneIcon, label: user.phone, href: `tel:${user.phone.replace(/[^\d+]/g, "")}` });
  }
  if (user?.websiteUrl) {
    links.push({ key: "web", icon: GlobeIcon, label: t("profile.websiteLabel"), onClick: () => openWebsite(user.websiteUrl!) });
  }
  if (user?.instagramUrl) {
    links.push({ key: "ig", icon: InstagramIcon, label: t("profile.instagram"), href: normalizeExternalUrl(user.instagramUrl) });
  }
  if (user?.youtubeUrl) {
    links.push({ key: "yt", icon: YoutubeIcon, label: t("profile.youtube"), href: normalizeExternalUrl(user.youtubeUrl) });
  }

  const name = user?.fullName?.trim() || `@${user?.username ?? "user"}`;

  return (
    <div className="flex flex-col items-center gap-5 rounded-[32px] bg-surface p-6 text-center md:flex-row md:items-start md:gap-7 md:text-left">
      <span className="block h-[120px] w-[120px] shrink-0 overflow-hidden rounded-full border-4 border-primary">
        <Avatar userId={user?.id} avatarUrl={user?.avatarUrl} alt={name} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="font-display text-2xl text-text">{name}</h1>
        <p className="text-sm text-text-muted">@{user?.username ?? "user"}</p>
        {user?.bio ? (
          <button
            type="button"
            onClick={() => setBioExpanded((value) => !value)}
            className={cn(
              "mt-1 whitespace-pre-line text-left text-sm leading-5 text-text max-md:text-center",
              !isBioExpanded && "line-clamp-3",
            )}
          >
            {user.bio}
          </button>
        ) : null}
        {affiliation ? <p className="text-sm text-text-muted">{affiliation}</p> : null}
        {links.length > 0 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
            {links.map(({ key, icon: Icon, label, href, onClick }) => {
              const className =
                "inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-semibold text-text hover:opacity-90";
              const content = (
                <>
                  <Icon width={16} height={16} className="text-primary" aria-hidden />
                  {label}
                </>
              );
              return href ? (
                <a key={key} href={href} target={href.startsWith("tel:") ? undefined : "_blank"} rel="noopener noreferrer" className={className}>
                  {content}
                </a>
              ) : (
                <button key={key} type="button" onClick={onClick} className={className}>
                  {content}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
