"use client";

import BellIcon from "@assets/icons/bell-icon.svg";
import ReportProblemIcon from "@assets/icons/report-problem-icon.svg";
import { ReportProblemDialog } from "@/components/feedback/ReportProblemDialog";
import FilterFilledIcon from "@assets/icons/filter-icon-filled.svg";
import FilterIcon from "@assets/icons/filter-icon.svg";
import FlagIcon from "@assets/icons/flag-icon.svg";
import ImageIcon from "@assets/icons/image-icon.svg";
import { AdminPostsSection } from "@/components/profile/AdminPostsSection";
import { FlaggedListingsSection } from "@/components/profile/FlaggedListingsSection";
import HouseFilledIcon from "@assets/icons/house-icon-filled.svg";
import HouseIcon from "@assets/icons/house-icon.svg";
import MenuIcon from "@assets/icons/menu-icon.svg";
import PlusIcon from "@assets/icons/plus-icon.svg";
import SaveFilledIcon from "@assets/icons/save-icon-filled.svg";
import SaveIcon from "@assets/icons/save-icon.svg";
import SearchFilledIcon from "@assets/icons/search-icon-filled.svg";
import SearchIcon from "@assets/icons/search-icon-bold.svg";
import UserIcon from "@assets/icons/user-icon.svg";
import { buttonClasses } from "@/components/genericComponents/Button";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { ListingCard, ListingGrid } from "@/components/listing/ListingCard";
import { PreferenceCard } from "@/components/profile/PreferenceCard";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { SavedSearchItem } from "@/components/profile/SavedSearchItem";
import { SettingsDrawer } from "@/components/profile/SettingsDrawer";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useIsStuck } from "@/hooks/useIsStuck";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { fetchOwnListingViewCounts, fetchSavedListings, fetchUserListings } from "@/services/listings";
import { fetchNotifications } from "@/services/notifications";
import { deletePreferenceSet, fetchPreferenceSets } from "@/services/preferences";
import { deleteSavedSearch, fetchSavedSearches } from "@/services/savedSearches";
import { useHomeFiltersStore } from "@/stores/useHomeFiltersStore";
import { MAX_PREFERENCE_SETS, type SavedSearch } from "@/types/types";
import { confirmDestructiveAction } from "@/utils/confirmAction";
import { getListingFilterChipLabels } from "@/utils/listingFilters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FC, type SVGProps } from "react";
import { useTranslation } from "react-i18next";

// "adminPosts" (FEAT-42) and "flagged" (FEAT-43) are admins only, in place of
// the other four: admins don't post, look or keep anything themselves.
const SECTIONS = [
  "yourListings",
  "preferences",
  "savedListings",
  "savedSearches",
  "adminPosts",
  "flagged",
] as const;
const ADMIN_SECTIONS: readonly Section[] = ["adminPosts", "flagged"];
type Section = (typeof SECTIONS)[number];

const isSection = (value: string | null): value is Section =>
  value != null && (SECTIONS as readonly string[]).includes(value);

/**
 * Your profile — web port of flatswipe/src/app/(protected)/(tabs)/profile.tsx.
 * Every account both posts and looks, so there are four tabs: your listings
 * (with view counts), your "what you're looking for" sets, saved listings and
 * saved searches. Settings live in the drawer behind the menu button, like the
 * app. `?section=` opens a given tab (the /looking-for page links to the sets
 * once all of them are in use).
 */
export function ProfileView() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, sessionUser, isLoadingProfile } = useCurrentUser();
  const setPendingSavedSearch = useHomeFiltersStore((state) => state.setPendingSavedSearch);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);
  const requestedSection = useSearchParams().get("section");
  const [section, setSection] = useState<Section>(() =>
    isSection(requestedSection) ? requestedSection : "yourListings",
  );
  const userId = sessionUser?.id ?? "";

  useEffect(() => {
    if (isSection(requestedSection)) setSection(requestedSection);
  }, [requestedSection]);

  // Admins publish marketing posts and review reported listings instead of
  // having listings, "What you're looking for" sets and saved tabs. The
  // profile arrives after the first render, so the section is corrected once
  // it does.
  const isAdmin = currentUser?.isAdmin === true;
  useEffect(() => {
    const isAdminSection = ADMIN_SECTIONS.includes(section);
    if (isAdmin && !isAdminSection) setSection("adminPosts");
    else if (!isAdmin && !isLoadingProfile && isAdminSection) setSection("yourListings");
  }, [isAdmin, isLoadingProfile, section]);

  const userListingsQuery = useQuery({
    queryKey: queryKeys.userListings(userId),
    queryFn: () => fetchUserListings(userId),
    enabled: !!sessionUser && section === "yourListings",
  });
  const viewCountsQuery = useQuery({
    queryKey: queryKeys.listingViewCounts(userId),
    queryFn: fetchOwnListingViewCounts,
    enabled: !!sessionUser && section === "yourListings",
  });
  const savedListingsQuery = useQuery({
    queryKey: queryKeys.savedListings(userId),
    queryFn: () => fetchSavedListings(userId),
    enabled: !!sessionUser && section === "savedListings",
  });
  const savedSearchesQuery = useQuery({
    queryKey: queryKeys.savedSearches(userId),
    queryFn: () => fetchSavedSearches(userId),
    enabled: !!sessionUser && section === "savedSearches",
  });
  const preferenceSetsQuery = useQuery({
    queryKey: queryKeys.preferenceSets(userId),
    queryFn: () => fetchPreferenceSets(userId),
    enabled: !!sessionUser && section === "preferences",
  });
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => fetchNotifications(userId),
    enabled: !!sessionUser,
    // The bell's badge: the web has no push, so it checks once a minute while
    // the tab is visible (React Query pauses the interval when it is not).
    refetchInterval: 60_000,
  });
  const unreadNotifications = (notificationsQuery.data ?? []).filter((item) => !item.isRead).length;

  const deleteSavedSearchMutation = useMutation({
    mutationFn: (savedSearchId: string) => deleteSavedSearch(userId, savedSearchId),
    onMutate: async (savedSearchId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.savedSearches(userId) });
      const previous = queryClient.getQueryData<SavedSearch[]>(queryKeys.savedSearches(userId));
      queryClient.setQueryData<SavedSearch[]>(queryKeys.savedSearches(userId), (current) =>
        (current ?? []).filter((item) => item.id !== savedSearchId),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(queryKeys.savedSearches(userId), context?.previous);
      showToast({ type: "error", message: t("profile.savedSearchDeleteFailed") });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedSearches(userId) }),
  });

  const deletePreferenceSetMutation = useMutation({
    mutationFn: (preferenceSetId: string) => deletePreferenceSet(userId, preferenceSetId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferenceSets(userId) });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
    },
    onError: () => showToast({ type: "error", message: t("preferences.deleteError") }),
  });

  const openSavedSearch = (savedSearch: SavedSearch) => {
    setPendingSavedSearch(
      savedSearch.kind === "buyers"
        ? { kind: "buyers", filters: savedSearch.filters }
        : { kind: "listings", filters: savedSearch.filters },
    );
    router.push("/feed");
  };

  const confirmDeleteSavedSearch = (savedSearch: SavedSearch) => {
    const name =
      getListingFilterChipLabels(savedSearch.filters, t).slice(0, 3).join(" · ") ||
      t("profile.savedSearchUnnamed");
    confirmDestructiveAction({
      title: t("profile.savedSearchDeleteTitle"),
      message: t("profile.savedSearchDeleteMessage", { name }),
      confirmLabel: t("profile.savedSearchDeleteConfirm"),
      onConfirm: () => deleteSavedSearchMutation.mutate(savedSearch.id),
    });
  };

  const confirmDeletePreferenceSet = (preferenceSetId: string) => {
    confirmDestructiveAction({
      title: t("preferences.deleteTitle"),
      message: t("preferences.deleteMessage"),
      confirmLabel: t("preferences.delete"),
      onConfirm: () => deletePreferenceSetMutation.mutate(preferenceSetId),
    });
  };

  const allTabs: { value: Section; label: string; icon: FC<SVGProps<SVGSVGElement>>; activeIcon: FC<SVGProps<SVGSVGElement>> }[] = [
    { value: "adminPosts", label: t("admin.postsTab"), icon: ImageIcon, activeIcon: ImageIcon },
    { value: "yourListings", label: t("profile.yourListingsTab"), icon: HouseIcon, activeIcon: HouseFilledIcon },
    { value: "preferences", label: t("preferences.tab"), icon: SearchIcon, activeIcon: SearchFilledIcon },
    { value: "savedListings", label: t("profile.savedListingsTab"), icon: SaveIcon, activeIcon: SaveFilledIcon },
    { value: "savedSearches", label: t("profile.savedSearchesTab"), icon: FilterIcon, activeIcon: FilterFilledIcon },
    { value: "flagged", label: t("moderation.flaggedTab"), icon: FlagIcon, activeIcon: FlagIcon },
  ];
  const tabs = allTabs.filter((tab) => ADMIN_SECTIONS.includes(tab.value) === isAdmin);

  const preferenceSets = preferenceSetsQuery.data ?? [];

  const stuckSentinelRef = useRef<HTMLDivElement>(null);
  const isBarStuck = useIsStuck(stuckSentinelRef);

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-10 pt-1 md:px-8 md:pt-2">
      {/* Marks where the action bar sits in the page: once it scrolls out of
          view, the bar is pinned and gets its backdrop. */}
      <div ref={stuckSentinelRef} aria-hidden />
      {/* Report / notifications / menu stay reachable while scrolling. The
          negative margins stretch its backdrop across the page's padding. */}
      <div
        className={cn(
          "sticky top-0 z-30 -mx-4 mb-3 flex justify-end gap-1 px-4 py-1 transition-[background-color,box-shadow] duration-200 md:-mx-8 md:px-8",
          isBarStuck && "bg-surface-muted/85 shadow-[0_6px_16px_rgba(0,0,0,0.06)] backdrop-blur-md",
        )}
      >
        {/* Admins receive reports as notifications; they don't send them. */}
        {!isAdmin ? (
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            aria-label={t("feedback.title")}
            title={t("feedback.title")}
            className="rounded-full p-2.5 text-text hover:bg-surface"
          >
            <ReportProblemIcon width={24} height={24} aria-hidden />
          </button>
        ) : null}
        <Link
          href="/notifications"
          aria-label={t("notifications.title")}
          className="relative rounded-full p-2.5 text-text hover:bg-surface"
        >
          <BellIcon width={24} height={24} aria-hidden />
          {unreadNotifications > 0 ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#D94B4B]" aria-hidden />
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={t("profile.title")}
          className="rounded-full p-2.5 text-text hover:bg-surface"
        >
          <MenuIcon width={22} height={26} aria-hidden />
        </button>
      </div>

      <ProfileCard
        user={currentUser}
        isLoading={isLoadingProfile}
        action={
          <Link href="/edit-profile" className={cn(buttonClasses(), "gap-2")}>
            {t("profile.editProfile")}
            <UserIcon width={16} height={16} aria-hidden />
          </Link>
        }
      />

      {/* The tabs share the row — no scrolling strip (which also scrolled
          vertically: each tab's underline sits 1px over the border). Below
          desktop they are icons only, like the app; the label stays the tab's
          accessible name and its tooltip. */}
      <div role="tablist" className="mt-6 flex border-b border-border">
        {tabs.map((tab) => {
          const isActive = tab.value === section;
          const Icon = isActive ? tab.activeIcon : tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              title={tab.label}
              onClick={() => setSection(tab.value)}
              className={cn(
                "-mb-px flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-2 py-3.5 text-sm font-semibold transition-colors",
                "lg:flex-none lg:px-4 lg:py-3",
                isActive ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text",
              )}
            >
              {/* The image icon's box has more padding, so it is drawn a size up. */}
              {tab.value === "adminPosts" ? (
                <Icon width={26} height={26} className="lg:h-[22px] lg:w-[22px]" aria-hidden />
              ) : (
                <Icon width={22} height={22} className="lg:h-[18px] lg:w-[18px]" aria-hidden />
              )}
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="pt-5">
        {section === "adminPosts" && isAdmin ? <AdminPostsSection userId={userId} /> : null}

        {section === "flagged" && isAdmin ? <FlaggedListingsSection /> : null}

        {section === "yourListings" ? (
          userListingsQuery.isLoading ? (
            <Spinner />
          ) : userListingsQuery.isError ? (
            <EmptyState title={t("profile.listingsLoadError")} />
          ) : (userListingsQuery.data ?? []).length === 0 ? (
            <EmptyState icon={HouseIcon} title={t("profile.yourListingsEmpty")}>
              <Link href="/new-listing" className={buttonClasses()}>
                {t("profile.postListingCta")}
              </Link>
            </EmptyState>
          ) : (
            <ListingGrid>
              {(userListingsQuery.data ?? []).map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  viewCount={viewCountsQuery.data?.[listing.id] ?? null}
                  showLifecycle
                />
              ))}
            </ListingGrid>
          )
        ) : null}

        {section === "preferences" ? (
          preferenceSetsQuery.isLoading ? (
            <Spinner />
          ) : preferenceSetsQuery.isError ? (
            <EmptyState title={t("preferences.loadError")} />
          ) : preferenceSets.length === 0 ? (
            <EmptyState icon={SearchIcon} title={t("preferences.emptyTitle")} message={t("preferences.emptyBody")}>
              <Link href="/preferences/new" className={buttonClasses()}>
                {t("preferences.add")}
              </Link>
            </EmptyState>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {preferenceSets.map((preferenceSet, index) => (
                <PreferenceCard
                  key={preferenceSet.id}
                  preferenceSet={preferenceSet}
                  index={index}
                  onOpen={() => router.push(`/preferences/${preferenceSet.id}`)}
                  onDelete={() => confirmDeletePreferenceSet(preferenceSet.id)}
                />
              ))}
              {preferenceSets.length < MAX_PREFERENCE_SETS ? (
                <Link
                  href="/preferences/new"
                  className="flex items-start gap-3.5 rounded-3xl border border-dashed border-border p-5 hover:bg-surface"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-text-on-primary">
                    <PlusIcon width={16} height={16} aria-hidden />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="font-semibold text-text">{t("preferences.add")}</span>
                    <span className="text-sm text-text-muted">{t("preferences.addHint")}</span>
                  </span>
                </Link>
              ) : (
                <p className="px-2 text-sm text-text-muted md:col-span-2">
                  {t("preferences.capReached", { max: MAX_PREFERENCE_SETS })}
                </p>
              )}
            </div>
          )
        ) : null}

        {section === "savedListings" ? (
          savedListingsQuery.isLoading ? (
            <Spinner />
          ) : savedListingsQuery.isError ? (
            <EmptyState title={t("profile.listingsLoadError")} />
          ) : (savedListingsQuery.data ?? []).length === 0 ? (
            <EmptyState icon={SaveIcon} title={t("profile.savedListingsEmpty")} />
          ) : (
            <ListingGrid>
              {(savedListingsQuery.data ?? []).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </ListingGrid>
          )
        ) : null}

        {section === "savedSearches" ? (
          savedSearchesQuery.isLoading ? (
            <Spinner />
          ) : savedSearchesQuery.isError ? (
            <EmptyState title={t("profile.savedSearchesLoadError")} />
          ) : (savedSearchesQuery.data ?? []).length === 0 ? (
            <EmptyState icon={FilterIcon} title={t("profile.savedSearchesEmpty")} />
          ) : (
            <SavedSearchGroups
              savedSearches={savedSearchesQuery.data ?? []}
              onOpen={openSavedSearch}
              onDelete={confirmDeleteSavedSearch}
            />
          )
        ) : null}
      </div>

      <SettingsDrawer open={isSettingsOpen} onOpenChange={setSettingsOpen} />
      <ReportProblemDialog open={isFeedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}

/** Properties first, buyers after; a heading only when both kinds exist. */
function SavedSearchGroups({
  savedSearches,
  onOpen,
  onDelete,
}: {
  savedSearches: SavedSearch[];
  onOpen: (savedSearch: SavedSearch) => void;
  onDelete: (savedSearch: SavedSearch) => void;
}) {
  const { t } = useTranslation();
  const listings = savedSearches.filter((item) => item.kind === "listings");
  const buyers = savedSearches.filter((item) => item.kind === "buyers");
  const showHeadings = listings.length > 0 && buyers.length > 0;

  const group = (items: SavedSearch[], heading: string) =>
    items.length === 0 ? null : (
      <div className="mb-4">
        {showHeadings ? (
          <h3 className="mb-1 px-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">{heading}</h3>
        ) : null}
        {/* One full-width row per saved search: the chips have room to read on one line. */}
        <div>
        {items.map((savedSearch) => (
          <SavedSearchItem
            key={savedSearch.id}
            savedSearch={savedSearch}
            onOpen={() => onOpen(savedSearch)}
            onDelete={() => onDelete(savedSearch)}
          />
        ))}
        </div>
      </div>
    );

  return (
    <div>
      {group(listings, t("profile.savedSearchesListingsGroup"))}
      {group(buyers, t("profile.savedSearchesBuyersGroup"))}
    </div>
  );
}
