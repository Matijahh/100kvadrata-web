// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import { mapPreferenceRow } from "@/services/preferences";
import { mapProfileRowToUser } from "@/services/profile";
import { BuyerFilters, BuyerProfile } from "@/types/types";

type FetchBuyersInput = {
  currentUserId: string;
  filters?: BuyerFilters;
};

const normalizeSearchText = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
};

const buildSearchPattern = (value: string) => `%${normalizeSearchText(value)}%`;

export const fetchBuyers = async (
  input: FetchBuyersInput,
): Promise<BuyerProfile[]> => {
  const { currentUserId, filters } = input;
  // One row per preference set, so a buyer with three matching sets produces three
  // cards — each showing the criteria that actually matched this search. The
  // rows are keyed by set id, not by user, which is what keeps them distinct
  // in the feed.
  let query = supabase
    .from("user_preferences")
    .select("*, profile:profiles!inner(*)")
    .neq("user_id", currentUserId)
    // Only buyers. Sellers keep their preference sets when they switch type — the
    // rows are hidden, not deleted — so row existence is not the signal.
    .eq("profile.account_type", "buyer")
    // ...and only sets that actually state something. An empty one tells a
    // seller nothing. `has_preferences` is a generated column (FIX-15), so a
    // buyer who fills anything in reappears here on their next save without
    // any further action.
    .eq("has_preferences", true);

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.listingType) {
    query = query.eq("listing_type", filters.listingType);
  }

  // Location values are canonical (picked via autocomplete), so match exactly
  // but case-insensitively to stay tolerant of older free-typed data.
  if (filters?.state?.trim()) {
    query = query.ilike("state", filters.state.trim());
  }

  if (filters?.city?.trim()) {
    query = query.ilike("city", filters.city.trim());
  }

  if (filters?.municipality?.trim()) {
    query = query.ilike("municipality", filters.municipality.trim());
  }

  // The range filters bracket the buyer's own range: "show me buyers whose
  // budget starts at or above X" and "whose ceiling is at or below Y". Same
  // shape for surface, rooms and floor number.
  if (filters?.minPriceEur != null) {
    query = query.gte("min_price_eur", filters.minPriceEur);
  }

  if (filters?.maxPriceEur != null) {
    query = query.lte("max_price_eur", filters.maxPriceEur);
  }

  if (filters?.minSurfaceM2 != null) {
    query = query.gte("min_surface_m2", filters.minSurfaceM2);
  }

  if (filters?.maxSurfaceM2 != null) {
    query = query.lte("max_surface_m2", filters.maxSurfaceM2);
  }

  if (filters?.minRooms != null) {
    query = query.gte("min_rooms", filters.minRooms);
  }

  if (filters?.maxRooms != null) {
    query = query.lte("max_rooms", filters.maxRooms);
  }

  // The exception to the bracketing above: a floor number is one floor on
  // both sides, so this matches it rather than bounding it.
  if (filters?.storeyFloorNumber != null) {
    query = query.eq("storey_floor_number", filters.storeyFloorNumber);
  }

  // These are arrays on both sides now: what the seller is asking about, and
  // what the buyer said they would accept. One value in common is a match —
  // a seller looking for someone open to a north-facing flat should find the
  // buyer who wrote down "north or east".
  if (filters?.orientation?.length) {
    query = query.overlaps("orientation", filters.orientation);
  }

  if (filters?.parking?.length) {
    query = query.overlaps("parking", filters.parking);
  }

  if (filters?.constructionType?.length) {
    query = query.overlaps("construction_type", filters.constructionType);
  }

  if (filters?.propertyCondition?.length) {
    query = query.overlaps("property_condition", filters.propertyCondition);
  }

  if (filters?.storey?.length) {
    query = query.overlaps("storey", filters.storey);
  }

  if (filters?.groundType?.length) {
    query = query.overlaps("ground_type", filters.groundType);
  }

  if (filters?.furniture?.length) {
    query = query.overlaps("furniture", filters.furniture);
  }

  // Matching the listings feed: heating types are alternatives (any), while
  // nearby objects and extra features read as requirements (all).
  if (filters?.heatingTypes?.length) {
    query = query.overlaps("heating_types", filters.heatingTypes);
  }

  if (filters?.nearbyObjects?.length) {
    query = query.contains("nearby_objects", filters.nearbyObjects);
  }

  if (filters?.additionalFeatures?.length) {
    query = query.contains("additional_features", filters.additionalFeatures);
  }

  if (filters?.usernameQuery?.trim()) {
    query = query.ilike(
      "profile.username",
      buildSearchPattern(filters.usernameQuery),
    );
  }

  const { data } = await query.order("updated_at", { ascending: false }).throwOnError();

  const rows = (data ?? []).filter((row: any) => row.profile);

  const searchTerm = normalizeSearchText(filters?.searchText);

  const buyers: BuyerProfile[] = rows.map((row: any) => {
    const preferenceSet = mapPreferenceRow(row);

    return {
      ...mapProfileRowToUser(row.profile),
      preferenceSetId: preferenceSet.id,
      preferences: preferenceSet,
    };
  });

  if (!searchTerm) {
    return buyers;
  }

  const lowerSearch = searchTerm.toLowerCase();

  return buyers.filter((buyer) => {
    const haystack = [
      buyer.username,
      buyer.fullName,
      buyer.bio,
      buyer.preferences.description,
      buyer.preferences.state,
      buyer.preferences.city,
      buyer.preferences.municipality,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(lowerSearch);
  });
};
