// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import {
  MAX_PREFERENCE_SETS,
  PreferenceCriteria,
  PreferenceSet,
} from "@/types/types";

/**
 * Thrown before the insert rather than after, so the user sees a translated
 * message instead of the trigger's opaque one. The cap is enforced in the
 * database too — see 20260919_user_preferences_v2_02_preference_sets.sql.
 */
export const PREFERENCE_SET_LIMIT_ERROR = "preference_set_limit_reached";

// Every criterion a preference set can hold. Keep in step with the mapper in
// services/buyers.ts, which reads the same columns for the Buyers feed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapPreferenceRow = (row: any): PreferenceSet => ({
  id: row.id,
  position: row.position ?? 0,
  description: row.description ?? null,
  category: row.category ?? null,
  listingType: row.listing_type ?? null,
  state: row.state ?? null,
  city: row.city ?? null,
  municipality: row.municipality ?? null,
  minSurfaceM2: row.min_surface_m2 ?? null,
  maxSurfaceM2: row.max_surface_m2 ?? null,
  minRooms: row.min_rooms ?? null,
  maxRooms: row.max_rooms ?? null,
  minPriceEur: row.min_price_eur ?? null,
  maxPriceEur: row.max_price_eur ?? null,
  // The array columns are NOT NULL with a '{}' default, so `?? []` only ever
  // catches a row read from a database where the multiselect migration has not
  // run yet — where the column is still a scalar or missing.
  orientation: toArray(row.orientation),
  parking: toArray(row.parking),
  constructionType: toArray(row.construction_type),
  propertyCondition: toArray(row.property_condition),
  storey: toArray(row.storey),
  storeyFloorNumber: row.storey_floor_number ?? null,
  heatingTypes: toArray(row.heating_types),
  groundType: toArray(row.ground_type),
  furniture: toArray(row.furniture),
  nearbyObjects: toArray(row.nearby_objects),
  additionalFeatures: toArray(row.additional_features),
});

// Tolerates the pre-migration scalar so a row written before the seven
// criteria became multiselect still loads with its old value preselected,
// rather than silently coming back empty.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toArray = <T,>(value: any): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value == null || value === "") {
    return [];
  }

  return [value as T];
};

const toPayload = (criteria: PreferenceCriteria) => ({
  // Blank is stored as null, so whitespace alone never counts towards
  // has_preferences or shows as an empty quote on the card.
  description: criteria.description?.trim() || null,
  category: criteria.category ?? null,
  listing_type: criteria.listingType ?? null,
  state: criteria.state ?? null,
  city: criteria.city ?? null,
  municipality: criteria.municipality ?? null,
  min_surface_m2: criteria.minSurfaceM2 ?? null,
  max_surface_m2: criteria.maxSurfaceM2 ?? null,
  min_rooms: criteria.minRooms ?? null,
  max_rooms: criteria.maxRooms ?? null,
  min_price_eur: criteria.minPriceEur ?? null,
  max_price_eur: criteria.maxPriceEur ?? null,
  storey_floor_number: criteria.storeyFloorNumber ?? null,
  // All NOT NULL with a '{}' default, so an unstated criterion has to be
  // written as an empty array rather than null.
  orientation: criteria.orientation ?? [],
  parking: criteria.parking ?? [],
  construction_type: criteria.constructionType ?? [],
  property_condition: criteria.propertyCondition ?? [],
  storey: criteria.storey ?? [],
  heating_types: criteria.heatingTypes ?? [],
  ground_type: criteria.groundType ?? [],
  furniture: criteria.furniture ?? [],
  nearby_objects: criteria.nearbyObjects ?? [],
  additional_features: criteria.additionalFeatures ?? [],
});

/** Every preference set the user keeps, in the order their cards appear. */
export const fetchPreferenceSets = async (
  userId: string,
): Promise<PreferenceSet[]> => {
  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .throwOnError();

  return (data ?? []).map(mapPreferenceRow);
};

/** One set, for the editor. Null when it has been deleted from elsewhere. */
export const fetchPreferenceSet = async (
  userId: string,
  preferenceSetId: string,
): Promise<PreferenceSet | null> => {
  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("id", preferenceSetId)
    .eq("user_id", userId)
    .maybeSingle()
    .throwOnError();

  return data ? mapPreferenceRow(data) : null;
};

export const createPreferenceSet = async (
  userId: string,
  criteria: PreferenceCriteria,
): Promise<PreferenceSet> => {
  // Pre-check so the cap reads as a translated message rather than whatever
  // PostgREST makes of the trigger's exception. The trigger stays the actual
  // guarantee; this is only about what the user sees.
  const { count } = await supabase
    .from("user_preferences")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .throwOnError();

  if ((count ?? 0) >= MAX_PREFERENCE_SETS) {
    throw new Error(PREFERENCE_SET_LIMIT_ERROR);
  }

  const { data } = await supabase
    .from("user_preferences")
    .insert({
      user_id: userId,
      // Appended to the end of the stack of cards.
      position: count ?? 0,
      ...toPayload(criteria),
    })
    .select("*")
    .single()
    .throwOnError();

  return mapPreferenceRow(data);
};

export const updatePreferenceSet = async (
  userId: string,
  preferenceSetId: string,
  criteria: PreferenceCriteria,
): Promise<PreferenceSet> => {
  const { data } = await supabase
    .from("user_preferences")
    .update({ ...toPayload(criteria), updated_at: new Date().toISOString() })
    .eq("id", preferenceSetId)
    // Redundant against the RLS policy, and kept anyway: it turns a wrong id
    // into zero rows updated rather than a policy error.
    .eq("user_id", userId)
    .select("*")
    .single()
    .throwOnError();

  return mapPreferenceRow(data);
};

export const deletePreferenceSet = async (
  userId: string,
  preferenceSetId: string,
): Promise<void> => {
  await supabase
    .from("user_preferences")
    .delete()
    .eq("id", preferenceSetId)
    .eq("user_id", userId)
    .throwOnError();
};
