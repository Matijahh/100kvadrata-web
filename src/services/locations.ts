// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import { Country } from "@/types/types";
import { normalizeLocationText } from "@/utils/locationText";

type CityRow = {
  city: string;
  municipality: string | null;
  municipality_count: number;
};

export type CitySuggestion = {
  city: string;
  /** Set when the city belongs to exactly one municipality (auto-fillable). */
  municipality: string | null;
  municipalityCount: number;
};

export const DEFAULT_COUNTRY_CODE = "RS";

export const fetchActiveCountries = async (): Promise<Country[]> => {
  const { data } = await supabase
    .from("countries")
    .select("code, name")
    .eq("is_active", true)
    .order("name")
    .throwOnError();

  return (data ?? []) as Country[];
};

export const searchCities = async (
  query: string,
  countryCode: string = DEFAULT_COUNTRY_CODE
): Promise<CitySuggestion[]> => {
  const term = normalizeLocationText(query);
  if (!term) return [];

  const { data } = await supabase
    .rpc("search_cities", { p_query: term, p_country: countryCode })
    .throwOnError();

  return ((data ?? []) as CityRow[]).map((row) => ({
    city: row.city,
    municipality: row.municipality,
    municipalityCount: row.municipality_count,
  }));
};

export const searchMunicipalities = async (
  query: string,
  options?: { city?: string | null; countryCode?: string }
): Promise<string[]> => {
  const term = normalizeLocationText(query);
  if (!term) return [];

  const { data } = await supabase
    .rpc("search_municipalities", {
      p_query: term,
      p_country: options?.countryCode ?? DEFAULT_COUNTRY_CODE,
      p_city: options?.city || null,
    })
    .throwOnError();

  return ((data ?? []) as { name: string }[]).map((row) => row.name);
};

export const searchStreets = async (
  query: string,
  city: string,
  options?: { municipality?: string | null; countryCode?: string }
): Promise<string[]> => {
  const term = normalizeLocationText(query);
  if (!term || !city.trim()) return [];

  const { data } = await supabase
    .rpc("search_streets", {
      p_query: term,
      p_city: city.trim(),
      p_country: options?.countryCode ?? DEFAULT_COUNTRY_CODE,
      p_municipality: options?.municipality || null,
    })
    .throwOnError();

  return ((data ?? []) as { name: string }[]).map((row) => row.name);
};
