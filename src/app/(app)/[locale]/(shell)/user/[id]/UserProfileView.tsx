"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import HouseIcon from "@assets/icons/house-icon.svg";
import SearchIcon from "@assets/icons/search-icon-bold.svg";
import { OfferListingDialog } from "@/components/buyers/OfferListingDialog";
import Button from "@/components/genericComponents/Button";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { ListingCard, ListingGrid } from "@/components/listing/ListingCard";
import { PreferenceCard } from "@/components/profile/PreferenceCard";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { fetchUserListings } from "@/services/listings";
import { fetchPreferenceSets } from "@/services/preferences";
import { fetchProfile } from "@/services/profile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Listing, Profile } from "@/types/types";
import { hasStatedCriteria } from "@/utils/preferenceSets";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Someone else's profile — web port of flatswipe/src/app/(protected)/
 * userProfile/[id].tsx. A seller shows their listings, a buyer what they are
 * looking for (blank sets left out: they tell a seller nothing).
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
  const [isOfferOpen, setOfferOpen] = useState(false);
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
  const isBuyer = profile.accountType === "buyer";
  // A selling account can send a buyer one of its listings from their profile,
  // as from the Buyers feed. Never on your own profile.
  const canOffer = isBuyer && currentUser?.accountType === "seller" && !!sessionUser && sessionUser.id !== id;

  const listingsQuery = useQuery({
    queryKey: queryKeys.userListings(id),
    queryFn: () => fetchUserListings(id),
    initialData: initialListings ?? undefined,
    enabled: !isBuyer,
    staleTime: 60_000,
  });

  const preferencesQuery = useQuery({
    queryKey: queryKeys.preferenceSets(id),
    queryFn: () => fetchPreferenceSets(id),
    enabled: isBuyer && !!sessionUser,
  });
  const preferenceSets = useMemo(
    () => (preferencesQuery.data ?? []).filter(hasStatedCriteria),
    [preferencesQuery.data],
  );

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/feed");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 md:px-8 md:pt-8">
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
        action={canOffer ? <Button title={t("buyers.offerProperty")} onClick={() => setOfferOpen(true)} className="min-w-0" /> : undefined}
      />
      <OfferListingDialog
        buyer={isOfferOpen && canOffer ? profile : null}
        currentUserId={sessionUser?.id ?? null}
        onClose={() => setOfferOpen(false)}
      />

      <div className="pt-6">
        {isBuyer ? (
          preferencesQuery.isLoading ? (
            <Spinner />
          ) : preferencesQuery.isError ? (
            <EmptyState title={t("preferences.loadError")} />
          ) : preferenceSets.length === 0 ? (
            <EmptyState icon={SearchIcon} title={t("profile.userPreferencesEmpty")} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {preferenceSets.map((preferenceSet, index) => (
                <PreferenceCard key={preferenceSet.id} preferenceSet={preferenceSet} index={index} />
              ))}
            </div>
          )
        ) : listingsQuery.isLoading ? (
          <Spinner />
        ) : listingsQuery.isError ? (
          <EmptyState title={t("profile.listingsLoadError")} />
        ) : (listingsQuery.data ?? []).length === 0 ? (
          <EmptyState icon={HouseIcon} title={t("profile.userListingsEmpty")} />
        ) : (
          <ListingGrid>
            {(listingsQuery.data ?? []).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </ListingGrid>
        )}
      </div>
    </div>
  );
}
