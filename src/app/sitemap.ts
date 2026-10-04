import { SITE_ORIGIN } from "@/content/common";
import { supabase } from "@/lib/supabase";
import type { MetadataRoute } from "next";

// Rebuilt at most hourly; listings come and go on a 30-day cycle, so that is
// plenty fresh for crawlers and costs one small query an hour.
export const revalidate = 3600;

// Google's limit per sitemap is 50,000 URLs; each listing is two (sr + en).
const MAX_LISTINGS = 10_000;

const url = (path: string) => `${SITE_ORIGIN}${path === "/" ? "" : path}`;

/** Both language versions of a path, each pointing at the other. */
const localized = (
  path: string,
  extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> = {},
): MetadataRoute.Sitemap => {
  const sr = url(path);
  const en = url(path === "/" ? "/en" : `/en${path}`);
  const alternates = { languages: { sr, en, "x-default": sr } };
  return [
    { url: sr, alternates, ...extra },
    { url: en, alternates, ...extra },
  ];
};

/**
 * Replaces the static public/sitemap.xml: the marketing and legal pages, the
 * feed, every live listing, and the public profiles of the sellers behind
 * them (buyers' profiles are noindex and left out).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    ...localized("/", { changeFrequency: "weekly", priority: 1 }),
    ...localized("/feed", { changeFrequency: "hourly", priority: 0.9 }),
    ...localized("/privacy-policy", { changeFrequency: "monthly", priority: 0.3 }),
    ...localized("/terms-of-service", { changeFrequency: "monthly", priority: 0.3 }),
    ...localized("/delete-account", { changeFrequency: "yearly", priority: 0.2 }),
  ];

  // Anonymous read through RLS — exactly what a visitor can open. Only the
  // columns the sitemap needs, so the payload stays small.
  const { data, error } = await supabase
    .from("listings")
    .select("id, user_id, created_at")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("id", { ascending: false })
    .limit(MAX_LISTINGS);

  if (error) {
    // A sitemap without listings beats a failed build or a 500 for crawlers.
    console.error("[sitemap] listings query failed:", error.message);
    return entries;
  }

  const sellerLastListing = new Map<string, string>();
  for (const listing of data ?? []) {
    entries.push(
      ...localized(`/listing/${listing.id}`, {
        lastModified: listing.created_at,
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    );
    if (!sellerLastListing.has(listing.user_id)) sellerLastListing.set(listing.user_id, listing.created_at);
  }

  for (const [userId, lastListingAt] of sellerLastListing) {
    entries.push(
      ...localized(`/user/${userId}`, { lastModified: lastListingAt, changeFrequency: "weekly", priority: 0.5 }),
    );
  }

  return entries;
}
