"use client";

import BuildingIcon from "@assets/icons/building-icon.svg";
import GlobeIcon from "@assets/icons/globe-icon.svg";
import MessagesIcon from "@assets/icons/messages-icon.svg";
import PercentCircleIcon from "@assets/icons/percent-circle-icon.svg";
import PlusCircleIcon from "@assets/icons/plus-circle-icon.svg";
import Logo from "@assets/logo.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { GetTheAppPrompt } from "@/components/shell/GetTheAppPrompt";
import { FEED_HOME_EVENT } from "@/constants/events";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { websiteHref } from "@/lib/websiteHref";
import type { AppLanguage } from "@/types/types";
import { fetchConversations } from "@/services/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import type { FC, SVGProps } from "react";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";

// Web counterpart of the app's tab bar (src/app/(protected)/(tabs)/_layout.tsx):
// the same four destinations, as a left rail on desktop and a floating bottom
// bar on phones. Only signed-in users get here (no guest mode on the web).

type NavItem = {
  href: "/feed" | "/new-listing" | "/inbox" | "/profile";
  label: string;
  icon?: FC<SVGProps<SVGSVGElement>>;
  badge?: number;
};

const UNREAD_REFRESH_MS = 60_000;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  // From the route, so the server-rendered link is already right.
  const locale = useLocale() as AppLanguage;
  const { currentUser } = useCurrentUser();
  // The second tab is the loan calculator for buyers and the listing form for
  // sellers, so its icon and label follow the account type.
  const isBuyer = currentUser?.accountType === "buyer";

  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversations(sessionUser?.id ?? ""),
    queryFn: () => fetchConversations(sessionUser!.id),
    enabled: !!sessionUser,
    refetchInterval: UNREAD_REFRESH_MS,
    refetchIntervalInBackground: false,
  });

  const totalUnread =
    conversationsQuery.data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  const items: NavItem[] = [
    { href: "/feed", label: t("tabs.home"), icon: BuildingIcon },
    {
      href: "/new-listing",
      label: isBuyer ? t("web.nav.loanCalculator") : t("tabs.newListing"),
      icon: isBuyer ? PercentCircleIcon : PlusCircleIcon,
    },
    {
      href: "/inbox",
      label: t("tabs.messages"),
      icon: MessagesIcon,
      badge: totalUnread,
    },
    { href: "/profile", label: t("tabs.profile") },
  ];

  const isActive = (href: NavItem["href"]) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/inbox" && pathname.startsWith("/chat/"));
  // A conversation is full screen on phones, as in the app (it sits outside
  // the tabs there): the composer takes the bottom edge.
  const isFullScreenOnPhone = pathname.startsWith("/chat/");

  const onNavigate = (item: NavItem) => (event: React.MouseEvent) => {
    // Already on the feed: Home clears filters, goes back to the top and
    // refreshes, like re-tapping the tab in the app.
    if (item.href === "/feed" && pathname === "/feed") {
      event.preventDefault();
      window.dispatchEvent(new Event(FEED_HOME_EVENT));
    }
  };

  const renderIcon = (item: NavItem, active: boolean) => {
    if (!item.icon) {
      return (
        <span
          className={cn(
            "block h-[34px] w-[34px] overflow-hidden rounded-full border-[3px] bg-surface-muted",
            active ? "border-primary-soft" : "border-primary",
          )}
        >
          <Avatar userId={currentUser?.id} avatarUrl={currentUser?.avatarUrl} />
        </span>
      );
    }

    const Icon = item.icon;

    return (
      <span className="relative">
        <Icon width={28} height={28} aria-hidden />
        {item.badge ? (
          <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D94B4B] px-[3px] text-[9px] font-semibold text-white">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        ) : null}
      </span>
    );
  };

  return (
    <div className="min-h-dvh md:pl-[96px]">
      {/* Desktop / tablet: left rail. */}
      <nav
        aria-label={t("web.nav.main")}
        className="fixed inset-y-0 left-0 z-40 hidden w-[96px] flex-col items-center gap-2 bg-surface py-6 shadow-[10px_0_24px_rgba(0,0,0,0.06)] md:flex"
      >
        {/* The logo's lettering is white (made for the app's dark splash), so it
            sits on the brand's dark tile like the app icon does. */}
        <Link
          href="/feed"
          aria-label="100m²"
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#161722]"
        >
          <Logo width={46} height={26} aria-hidden />
        </Link>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate(item)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-[80px] flex-col items-center gap-1 rounded-2xl py-3 text-[11px] transition-colors",
                active ? "text-primary-soft" : "text-primary hover:bg-surface-muted",
              )}
            >
              {renderIcon(item, active)}
              <span className="text-center leading-tight text-text-muted">{item.label}</span>
            </Link>
          );
        })}
        {/* Back to the website (a different root layout: full page load). */}
        <a
          href={websiteHref(locale)}
          className="mt-auto flex w-[80px] flex-col items-center gap-1 rounded-2xl py-3 text-[11px] text-primary transition-colors hover:bg-surface-muted"
        >
          <GlobeIcon width={26} height={26} aria-hidden />
          <span className="text-center leading-tight text-text-muted">{t("web.nav.website")}</span>
        </a>
      </nav>

      <main className={cn("md:pb-0", !isFullScreenOnPhone && "pb-[92px]")}>{children}</main>

      {/* Phone: floating bottom bar, same shape as the app's. */}
      <nav
        aria-label={t("web.nav.main")}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 h-[76px] items-center justify-around rounded-t-[45px] bg-surface px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_24px_rgba(0,0,0,0.25)] md:hidden",
          isFullScreenOnPhone ? "hidden" : "flex",
        )}
      >
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate(item)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 w-12 items-center justify-center",
                active ? "text-primary-soft" : "text-primary",
              )}
            >
              {renderIcon(item, active)}
            </Link>
          );
        })}
      </nav>

      <GetTheAppPrompt aboveTabBar={!isFullScreenOnPhone} />
    </div>
  );
}
