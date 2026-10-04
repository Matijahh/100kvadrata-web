// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import { ListingCreditSummary, PackageTier } from "@/types/types";

// Buy a package (payment is stubbed server-side). Grants listing credits at
// the given tier and returns the updated balance row for that tier.
export const purchasePackage = async (tier: PackageTier) => {
  const { data } = await supabase
    .rpc("purchase_package", { p_tier: tier })
    .throwOnError();

  return data;
};

// Current per-tier listing credit balance for a user, plus the total.
export const fetchListingCredits = async (
  userId: string,
): Promise<ListingCreditSummary> => {
  const { data } = await supabase
    .from("user_listing_credits")
    .select("tier, credits_remaining")
    .eq("user_id", userId)
    .throwOnError();

  const byTier: ListingCreditSummary["byTier"] = {};
  let total = 0;

  (data ?? []).forEach((row) => {
    const tier = row.tier as PackageTier;
    const remaining = row.credits_remaining ?? 0;
    byTier[tier] = remaining;
    total += remaining;
  });

  return { byTier, total };
};

// Exclusive Plus perk gate: access while the user is a current Exclusive Plus
// customer — they hold an unused exclusive_plus credit OR have at least one
// non-expired exclusive_plus listing.
export const fetchHasBuyersAccess = async (userId: string): Promise<boolean> => {
  const { data: creditRows } = await supabase
    .from("user_listing_credits")
    .select("credits_remaining")
    .eq("user_id", userId)
    .eq("tier", "exclusive_plus")
    .gt("credits_remaining", 0)
    .limit(1)
    .throwOnError();

  if ((creditRows ?? []).length > 0) {
    return true;
  }

  const nowIso = new Date().toISOString();
  const { data: listingRows } = await supabase
    .from("listings")
    .select("id")
    .eq("user_id", userId)
    .eq("tier", "exclusive_plus")
    .gt("expires_at", nowIso)
    .limit(1)
    .throwOnError();

  return (listingRows ?? []).length > 0;
};
