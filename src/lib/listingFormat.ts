import type { Listing, ListingMedia } from "@/types/types";
import { getListingFacts } from "@/utils/listingFacts";

// Small display helpers the app keeps private inside its listing card
// (flatswipe/src/components/listingListItem.tsx). Same rules, so a listing
// reads identically on both platforms.

/** Rooms can be fractional (2.5): integers print as-is, the rest to one decimal. */
export const formatListingMetric = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

/**
 * The facts line on a feed card: the type of property, then the app's
 * getListingFacts (size and rooms, with proper plurals). The area those
 * facts end with is left out here: the web card prints the address on its own
 * line just above.
 *
 *   ["Stan", "65 m²", "2 sobe"]
 */
export const getListingCardFacts = (
  listing: Listing,
  t: (key: string, options?: Record<string, unknown>) => string,
): string[] => [
  ...(listing.category ? [t(`newListing.categories.${listing.category}`)] : []),
  ...getListingFacts({ ...listing, municipality: null, city: null }, t),
];

/** "Street 12, City", or whichever half exists. */
export const getListingAddressLabel = (listing: Listing) => {
  const street = listing.street?.trim();
  const streetNumber = listing.street_number != null ? String(listing.street_number).trim() : "";
  const city = listing.city?.trim();

  const streetPart = [street, streetNumber].filter(Boolean).join(" ").trim();

  if (streetPart && city) {
    return `${streetPart}, ${city}`;
  }

  return streetPart || city || null;
};

/**
 * What the media helpers read. A Listing is one; so is an admin marketing post
 * (FEAT-42), which is why this is not simply `Listing`.
 */
export type MediaSource = {
  media: Pick<ListingMedia, "id" | "kind" | "public_url">[];
  media_mode?: string | null;
  video_url?: string | null;
  description?: string | null;
};

/** The listing's photos in display order, and its video if it has one. */
export const splitListingMedia = (listing: MediaSource) => {
  const photos = listing.media.filter((item) => item.kind === "photo");
  const videoUrl =
    listing.media.find((item) => item.kind === "video")?.public_url ?? listing.video_url ?? null;

  // Same precedence as the app: a listing published as video shows its video,
  // otherwise photos, falling back to whichever exists.
  const showVideo = !!videoUrl && (listing.media_mode === "video" || photos.length === 0);
  const showPhotos = photos.length > 0 && !showVideo;

  return { photos, videoUrl, showVideo, showPhotos };
};

/** Whole days until expiry (≤ 0 once expired), or null for listings that never expire. */
export const getDaysLeft = (listing: Listing) =>
  listing.expires_at
    ? Math.ceil((new Date(listing.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

export const isListingExpired = (listing: Listing) =>
  !!listing.expires_at && new Date(listing.expires_at).getTime() <= Date.now();
