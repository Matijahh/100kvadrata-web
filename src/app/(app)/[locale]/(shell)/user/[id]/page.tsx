import { getServerT } from "@/i18n/server";
import { fetchUserListings } from "@/services/listings";
import { fetchProfile } from "@/services/profile";
import type { AppLanguage, Listing, Profile } from "@/types/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { UserProfileView } from "./UserProfileView";

// Someone else's profile. Rendered on the server so an agency's page — its
// listings, contact links — can be shared and found in search. Buyers are
// private people, so their profiles are kept out of search results.

type PageProps = { params: Promise<{ locale: string; id: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getProfile = cache(async (id: string): Promise<Profile | null> => {
  if (!UUID_PATTERN.test(id)) return null;

  try {
    return await fetchProfile(id);
  } catch (error) {
    if ((error as { code?: string })?.code === "PGRST116") return null;
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const profile = await getProfile(id);
  const t = getServerT(locale as AppLanguage);

  if (!profile) {
    return { title: t("web.listing.notFoundTitle"), robots: { index: false } };
  }

  const name = profile.fullName?.trim() || profile.agencyName?.trim() || `@${profile.username}`;
  const description =
    profile.bio?.replace(/\s+/g, " ").trim().slice(0, 180) ||
    [profile.agencyName, profile.city].filter(Boolean).join(" · ") ||
    undefined;

  return {
    title: name,
    description,
    robots: profile.accountType === "buyer" ? { index: false, follow: false } : undefined,
    openGraph: {
      title: name,
      description,
      type: "profile",
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : ["/favicon.png"],
    },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getProfile(id);

  if (!profile) {
    notFound();
  }

  // Sellers' listings are public, so they render with the page. Buyers'
  // preference sets are readable by signed-in users only, so those load in
  // the browser with the visitor's session.
  let listings: Listing[] | null = null;
  if (profile.accountType !== "buyer") {
    listings = await fetchUserListings(id).catch(() => null);
  }

  return <UserProfileView initialProfile={profile} initialListings={listings} />;
}
