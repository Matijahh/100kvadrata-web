// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { Listing } from "@/types/types";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type FactListing = Pick<Listing, "surface_m2" | "rooms" | "municipality" | "city">;

/** 2 → "2", 2.5 → "2.5", as the listing details write it. */
const formatMetric = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/**
 * The facts a buyer checks before anything else, in the order they check them:
 * size, rooms, where. Shown on the feed card under the address, so they can
 * be read without opening the details. Missing facts are simply left out.
 *
 *   ["65 m²", "2.5 sobe", "Vračar"]
 */
export const getListingFacts = (listing: FactListing, t: TranslateFn): string[] => {
  const facts: string[] = [];

  if (listing.surface_m2 != null && listing.surface_m2 > 0) {
    facts.push(t("listing.factSurface", { value: formatMetric(listing.surface_m2) }));
  }

  if (listing.rooms != null && listing.rooms > 0) {
    // Whole numbers follow the plural rules (1 soba, 2 sobe, 5 soba). A half
    // room has its own string: Serbian puts any decimal in the genitive
    // singular ("2.5 sobe"), which no plural category gives.
    facts.push(
      Number.isInteger(listing.rooms)
        ? t("listing.factRooms", { count: listing.rooms })
        : t("listing.factRoomsDecimal", { value: formatMetric(listing.rooms) }),
    );
  }

  const area = listing.municipality?.trim() || listing.city?.trim();
  if (area) {
    facts.push(area);
  }

  return facts;
};
