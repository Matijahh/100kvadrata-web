// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import {
  BuyerFilters,
  ListingFilters,
  SavedSearch,
  SavedSearchKind,
} from "@/types/types";
import { normalizeBuyerFilters } from "@/utils/buyerFilters";
import { normalizeListingFilters } from "@/utils/listingFilters";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SavedSearchRow = {
  id: string;
  user_id: string;
  kind: SavedSearchKind | null;
  filters: any;
  created_at: string;
};

export const fetchSavedSearches = async (userId: string) => {
  const { data } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .throwOnError();

  return (data ?? []).map(mapSavedSearchRow);
};

export const createSavedSearch = async (
  userId: string,
  kind: SavedSearchKind,
  filters: ListingFilters | BuyerFilters,
) => {
  const { data } = await supabase
    .from("saved_searches")
    .insert({
      user_id: userId,
      kind,
      filters: normalizeFilters(kind, filters),
    })
    .select("*")
    .single()
    .throwOnError();

  return mapSavedSearchRow(data as SavedSearchRow);
};

export const deleteSavedSearch = async (userId: string, savedSearchId: string) => {
  await supabase
    .from("saved_searches")
    .delete()
    .eq("id", savedSearchId)
    .eq("user_id", userId)
    .throwOnError();
};

/**
 * Each feed has its own idea of what a filter set contains, so the criteria are
 * cleaned by the rules of the feed they belong to. Running buyer filters
 * through the listings normaliser would quietly drop `usernameQuery`.
 */
const normalizeFilters = (
  kind: SavedSearchKind,
  filters: ListingFilters | BuyerFilters,
) =>
  kind === "buyers"
    ? normalizeBuyerFilters(filters as BuyerFilters)
    : normalizeListingFilters(filters as ListingFilters);

const mapSavedSearchRow = (row: SavedSearchRow): SavedSearch => {
  // Null only for a row read before the kind column existed, and anything
  // saved back then could only have been a properties search.
  const kind: SavedSearchKind = row.kind ?? "listings";
  const filters = normalizeFilters(kind, row.filters ?? {});

  const base = { id: row.id, userId: row.user_id, createdAt: row.created_at };

  return kind === "buyers"
    ? { ...base, kind, filters: filters as BuyerFilters }
    : { ...base, kind, filters: filters as ListingFilters };
};
