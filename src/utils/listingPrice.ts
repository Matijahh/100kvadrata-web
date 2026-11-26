// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { Listing } from "@/types/types";
import { formatAmount } from "@/utils/rangeLabels";

type TranslateFn = (key: string) => string;

type PricedListing = Pick<
  Listing,
  "listing_type" | "price_eur" | "surface_m2" | "total_price_eur"
>;

/**
 * The total asking price of a sale listing, or null when there is none to show.
 *
 * The seller's own figure wins. Without one it is the price per m² times the
 * surface, rounded to the nearest 100 € so a calculated total does not read as
 * falsely exact. A calculated total is shown exactly like an entered one, so a
 * listing never advertises that its seller skipped a field.
 *
 * Rentals have no total: their price is already the whole monthly amount.
 */
export const getListingTotalPrice = (listing: PricedListing) => {
  if (listing.listing_type !== "forSale") {
    return null;
  }

  if (listing.total_price_eur != null) {
    return listing.total_price_eur;
  }

  // Without a surface the multiplication would be a wrong total, which is
  // worse than showing the per-m² price the seller actually typed.
  if (listing.price_eur == null || listing.surface_m2 == null || listing.surface_m2 <= 0) {
    return null;
  }

  return Math.round((listing.price_eur * listing.surface_m2) / 100) * 100;
};

/**
 * A sale's price per m², for the small line under its total on the feed card,
 * or null where there is nothing to add: a rental, or a sale whose main label
 * is already the per-m² price because it has no surface to multiply by.
 *
 * The seller's own per-m² figure wins; otherwise it is worked out from the
 * total they entered, rounded to the euro.
 */
export const getListingPricePerSquare = (listing: PricedListing) => {
  if (getListingTotalPrice(listing) == null) {
    return null;
  }

  if (listing.price_eur != null) {
    return listing.price_eur;
  }

  if (listing.total_price_eur != null && listing.surface_m2 != null && listing.surface_m2 > 0) {
    return Math.round(listing.total_price_eur / listing.surface_m2);
  }

  return null;
};

/** "178.600 €" — a euro amount with the Serbian thousands separator and no suffix. */
export const formatEuros = (value: number) => `${formatAmount(value)} €`;

/**
 * The one price label for a listing everywhere it is summarised — the feed
 * card, the offer sheet and both chat references — so they cannot drift apart.
 *
 *   sale with a total   →  178.600 €
 *   sale, no surface    →  2.350 € / m2
 *   rent                →  450 € / mesečno
 */
export const getListingPriceLabel = (listing: PricedListing, t: TranslateFn) => {
  const totalPrice = getListingTotalPrice(listing);

  if (totalPrice != null) {
    return formatEuros(totalPrice);
  }

  if (listing.price_eur == null) {
    return null;
  }

  const formattedValue = formatEuros(listing.price_eur);

  if (listing.listing_type === "forSale") {
    return `${formattedValue} ${t("listing.pricePerSquareSuffix")}`;
  }

  if (listing.listing_type === "forRent") {
    return `${formattedValue} ${t("listing.pricePerMonthSuffix")}`;
  }

  return formattedValue;
};
