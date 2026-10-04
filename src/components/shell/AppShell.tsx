"use client";

import BuildingIcon from "@assets/icons/building-icon.svg";
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
import { fetchConversations } from "@/services/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  SignInPromptReason,
  useSignInPromptStore,
} from "@/stores/useSignInPromptStore";
import { useQuery } from "@tanstack/react-query";
import type { FC, SVGProps } from "react";
import { useTranslation } from "react-i18next";

// Web counterpart of the app's tab bar (src/app/(protected)/(tabs)/_layout.tsx):
// the same four destinations, as a left rail on desktop and a floating bottom
// bar on phones. Guests tapping an account-only tab get the sign-in dialog
// instead of a navigation, exactly like the app (guideline 5.1.1(v) there).

type NavItem = {
  href: "/feed" | "/new-listing" | "/inbox" | "/profile";
  label: string;
  icon?: FC<SVGProps<SVGSVGElement>>;
  guestReason?: SignInPromptReason;
  badge?: number;
};

const UNREAD_REFRESH_MS = 60_000;

export function AppShell({
  getAppCard,
  children,
}: {
  /** Server-rendered "get the app" QR card for the desktop rail. */
  getAppCard?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const promptSignIn = useSignInPromptStore((state) => state.promptSignIn);
  const { currentUser } = useCurrentUser();
  const isGuest = !sessionUser;
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
      guestReason: "newListing",
    },
    {
      href: "/inbox",
      label: t("tabs.messages"),
      icon: MessagesIcon,
      guestReason: "inbox",
      badge: totalUnread,
    },
    { href: "/profile", label: t("tabs.profile"), guestReason: "profile" },
  ];

  const isActive = (href: NavItem["href"]) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/inbox" && pathname.startsWith("/chat/"));
  // A conversation is full screen on phones, as in the app (it sits outside
  // the tabs there): the composer takes the bottom edge.
  const isFullScreenOnPhone = pathname.startsWith("/chat/");

  const onNavigate = (item: NavItem) => (event: React.MouseEvent) => {
    if (isGuest && item.guestReason) {
      event.preventDefault();
      promptSignIn(item.guestReason);
      return;
    }
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
          className="mb-6 flex h-[56px] w-[72px] items-center justify-center rounded-2xl bg-[#161722]"
        >
          <Logo width={52} height={30} aria-hidden />
        </Link>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate(item)}
              // A guest never navigates there (the sign-in dialog opens), so
              // prefetching would only fetch the login redirect.
              prefetch={isGuest && item.guestReason ? false : undefined}
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
        {/* Desktop visitors expect a visible way in; on phones the account
            tabs open the sign-in sheet, like the app. */}
        {isGuest ? (
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="mt-2 w-[80px] rounded-full bg-primary px-2 py-2 text-center text-[11px] font-semibold text-text-on-primary hover:opacity-90"
          >
            {t("web.nav.signIn")}
          </Link>
        ) : null}
        <div className="mt-auto hidden px-2 lg:block">{getAppCard}</div>
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
              // A guest never navigates there (the sign-in dialog opens), so
              // prefetching would only fetch the login redirect.
              prefetch={isGuest && item.guestReason ? false : undefined}
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

      <GetTheAppPrompt />
    </div>
  );
}
