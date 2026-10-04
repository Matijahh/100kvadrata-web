import type { Listing } from "@/types/types";

// Small display helpers the app keeps private inside its listing card
// (flatswipe/src/components/listingListItem.tsx). Same rules, so a listing
// reads identically on both platforms.

/** Rooms can be fractional (2.5): integers print as-is, the rest to one decimal. */
export const formatListingMetric = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

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

/** The listing's photos in display order, and its video if it has one. */
export const splitListingMedia = (listing: Listing) => {
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
