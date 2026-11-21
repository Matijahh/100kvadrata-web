"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import HouseFilledIcon from "@assets/icons/house-icon-filled.svg";
import HouseIcon from "@assets/icons/house-icon.svg";
import SearchFilledIcon from "@assets/icons/search-icon-filled.svg";
import SearchIcon from "@assets/icons/search-icon-bold.svg";
import { OfferListingDialog } from "@/components/buyers/OfferListingDialog";
import Button from "@/components/genericComponents/Button";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { ListingCard, ListingGrid } from "@/components/listing/ListingCard";
import { PreferenceCard } from "@/components/profile/PreferenceCard";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { fetchUserListings } from "@/services/listings";
import { fetchPreferenceSets } from "@/services/preferences";
import { fetchProfile } from "@/services/profile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDirectMessage } from "@/hooks/useDirectMessage";
import ChatIcon from "@assets/icons/chat-icon.svg";
import type { Listing, Profile } from "@/types/types";
import { hasStatedCriteria } from "@/utils/preferenceSets";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FC, type SVGProps } from "react";
import { useTranslation } from "react-i18next";

type Section = "listings" | "preferences";

/**
 * Someone else's profile — web port of flatswipe/src/app/(protected)/
 * userProfile/[id].tsx. Any account can both post and look, so there is a tab
 * for each kind the person actually has: listings first, then what they are
 * looking for (blank sets left out: they tell a visitor nothing). Offer
 * property shows whenever they have said what they are looking for.
 */
export function UserProfileView({
  initialProfile,
  initialListings,
}: {
  initialProfile: Profile;
  initialListings: Listing[] | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { sessionUser, currentUser } = useCurrentUser();
  const { openDirectMessage, pendingUserId } = useDirectMessage();
  const [isOfferOpen, setOfferOpen] = useState(false);
  // What the visitor clicked, if anything; until then the first tab with
  // something in it is shown.
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const id = initialProfile.id;

  // Your own public profile is your profile page.
  useEffect(() => {
    if (sessionUser?.id === id) router.replace("/profile");
  }, [sessionUser?.id, id, router]);

  const { data: profile = initialProfile } = useQuery({
    queryKey: queryKeys.profile(id),
    queryFn: () => fetchProfile(id),
    initialData: initialProfile,
    staleTime: 60_000,
  });

  const listingsQuery = useQuery({
    queryKey: queryKeys.userListings(id),
    queryFn: () => fetchUserListings(id),
    initialData: initialListings ?? undefined,
    staleTime: 60_000,
  });

  const preferencesQuery = useQuery({
    queryKey: queryKeys.preferenceSets(id),
    queryFn: () => fetchPreferenceSets(id),
    enabled: !!sessionUser,
  });

  const listings = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data]);
  const preferenceSets = useMemo(
    () => (preferencesQuery.data ?? []).filter(hasStatedCriteria),
    [preferencesQuery.data],
  );

  const sections = useMemo(() => {
    const available: Section[] = [];
    if (listings.length > 0) available.push("listings");
    if (preferenceSets.length > 0) available.push("preferences");
    return available;
  }, [listings.length, preferenceSets.length]);

  const activeSection =
    selectedSection && sections.includes(selectedSection) ? selectedSection : (sections[0] ?? null);

  // Which tabs exist depends on both lists, so nothing is drawn until both
  // have answered — a listings tab must not appear alone and gain a
  // neighbour a moment later.
  const isLoadingSections = listingsQuery.isLoading || (!!sessionUser && preferencesQuery.isLoading);

  // As from the Buyers feed: anyone signed in can send a listing to someone
  // who has said what they are looking for. Never on your own profile.
  const canOffer = !!sessionUser && sessionUser.id !== id && preferenceSets.length > 0;
  // Admins message anyone directly instead (FEAT-42): nothing to offer, and
  // no need for the person to have said what they are looking for.
  const canAdminMessage = currentUser?.isAdmin === true && !!sessionUser && sessionUser.id !== id;

  const tabs: { value: Section; label: string; icon: FC<SVGProps<SVGSVGElement>>; activeIcon: FC<SVGProps<SVGSVGElement>> }[] =
    sections.map((section) =>
      section === "listings"
        ? { value: section, label: t("profile.userListingsTab"), icon: HouseIcon, activeIcon: HouseFilledIcon }
        : { value: section, label: t("profile.userPreferencesTab"), icon: SearchIcon, activeIcon: SearchFilledIcon },
    );

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/feed");
  };

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-10 pt-4 md:px-8 md:pt-8">
      <button
        type="button"
        onClick={goBack}
        aria-label={t("web.listing.back")}
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-text hover:bg-surface"
      >
        <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
      </button>

      <ProfileCard
        user={profile}
        action={
          canAdminMessage ? (
            <Button
              title={t("admin.message")}
              iconSvg={ChatIcon}
              onClick={() => void openDirectMessage(id)}
              disabled={pendingUserId === id}
              className="min-w-0"
            />
          ) : canOffer ? (
            <Button title={t("buyers.offerProperty")} onClick={() => setOfferOpen(true)} className="min-w-0" />
          ) : undefined
        }
      />
      <OfferListingDialog
        buyer={isOfferOpen && canOffer ? profile : null}
        currentUserId={sessionUser?.id ?? null}
        onClose={() => setOfferOpen(false)}
      />

      {isLoadingSections ? (
        <Spinner className="py-16" />
      ) : !activeSection ? (
        listingsQuery.isError || preferencesQuery.isError ? (
          <EmptyState title={t("profile.listingsLoadError")} className="mt-6" />
        ) : (
          <EmptyState icon={HouseIcon} title={t("profile.userProfileEmpty")} className="mt-6" />
        )
      ) : (
        <>
          {/* The same tab row as your own profile: icons only below desktop,
              the label staying the accessible name and tooltip. */}
          {/* A lone tab has nothing to switch to, so the row only shows with two. */}
          {tabs.length > 1 ? (
          <div role="tablist" className="mt-6 flex border-b border-border">
            {tabs.map((tab) => {
              const isActive = tab.value === activeSection;
              const Icon = isActive ? tab.activeIcon : tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  title={tab.label}
                  onClick={() => setSelectedSection(tab.value)}
                  className={cn(
                    "-mb-px flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-2 py-3.5 text-sm font-semibold transition-colors",
                    "lg:flex-none lg:px-4 lg:py-3",
                    isActive ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text",
                  )}
                >
                  <Icon width={22} height={22} className="lg:h-[18px] lg:w-[18px]" aria-hidden />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
          ) : null}

          <div role="tabpanel" className={tabs.length > 1 ? "pt-5" : "pt-6"}>
            {activeSection === "preferences" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {preferenceSets.map((preferenceSet, index) => (
                  <PreferenceCard key={preferenceSet.id} preferenceSet={preferenceSet} index={index} />
                ))}
              </div>
            ) : (
              <ListingGrid>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </ListingGrid>
            )}
          </div>
        </>
      )}
    </div>
  );
}
