// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";

export type StorePlatform = "ios" | "android";

/** The version currently live in that platform's store, or null if unset. */
export const fetchLatestAppVersion = async (platform: StorePlatform) => {
  const { data } = await supabase
    .from("app_versions")
    .select("latest_version")
    .eq("platform", platform)
    .maybeSingle()
    .throwOnError();

  return (data?.latest_version as string | undefined) ?? null;
};

const toSegments = (version: string) =>
  version
    .trim()
    .split(".")
    .map((segment) => parseInt(segment, 10) || 0);

/**
 * Numeric, segment-by-segment comparison — so `1.10.0` is newer than `1.9.0`
 * and a missing segment counts as 0 (`1.1` equals `1.1.0`).
 */
export const isVersionOlder = (installed: string, latest: string) => {
  const a = toSegments(installed);
  const b = toSegments(latest);
  const length = Math.max(a.length, b.length);

  for (let i = 0; i < length; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff < 0;
  }

  return false;
};
