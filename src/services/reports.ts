// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import { mapListingsWithProfiles } from "@/services/listings";
import { FlaggedListing, ListingRemovalReason } from "@/types/types";

export type ReportReason = ListingRemovalReason;

export const reportListing = async (
  reporterId: string,
  listingId: number,
  reason: ReportReason,
) => {
  await supabase
    .from("reports")
    .insert({
      reporter_id: reporterId,
      target_type: "listing",
      listing_id: listingId,
      reason,
    })
    .throwOnError();
};

export const reportUser = async (
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
) => {
  await supabase
    .from("reports")
    .insert({
      reporter_id: reporterId,
      target_type: "user",
      reported_user_id: reportedUserId,
      reason,
    })
    .throwOnError();
};

export const blockUser = async (blockerId: string, blockedId: string) => {
  await supabase
    .from("blocked_users")
    .upsert(
      { blocker_id: blockerId, blocked_id: blockedId },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
    )
    .throwOnError();
};

export const unblockUser = async (blockerId: string, blockedId: string) => {
  await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .throwOnError();
};

export const fetchBlockedUserIds = async (
  userId: string,
): Promise<string[]> => {
  const { data } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", userId)
    .throwOnError();

  return (data ?? []).map((row) => row.blocked_id);
};

// ---------------------------------------------------------------------------
// Admin moderation (FEAT-43)
// ---------------------------------------------------------------------------
//
// Every call below is admin-only on the server: the database functions raise
// NOT_ADMIN and the report policies return nothing to anyone else.

type FlaggedListingRow = {
  listing: Record<string, unknown> & { id: number };
  report_count: number;
  spam_count: number;
  inappropriate_count: number;
  last_reported_at: string;
};

/** Every reported listing, newest report first. */
export const fetchFlaggedListings = async (): Promise<FlaggedListing[]> => {
  const { data } = await supabase.rpc("get_flagged_listings").throwOnError();
  const rows = (data ?? []) as FlaggedListingRow[];
  const listings = await mapListingsWithProfiles(rows.map((row) => row.listing));

  return listings.map((listing, index) => ({
    ...listing,
    reportCount: rows[index].report_count,
    spamReportCount: rows[index].spam_count,
    inappropriateReportCount: rows[index].inappropriate_count,
    lastReportedAt: rows[index].last_reported_at,
  }));
};

export type ListingRemovalResult = {
  /** How many listings this owner has now had removed. */
  removalCount: number;
  /** True when this removal got the owner banned. */
  banned: boolean;
};

/**
 * Deletes a listing for breaking the rules, tells its owner why, and bans the
 * owner on their third removal — all in one database call. The files go
 * afterwards, because SQL can't delete Storage objects; that part is
 * best-effort, like every other listing deletion, since the listing is
 * already gone and a retry would find nothing to remove.
 */
export const removeListingForViolation = async (
  listingId: number,
  reason: ListingRemovalReason,
): Promise<ListingRemovalResult> => {
  const { data } = await supabase
    .rpc("remove_listing_for_violation", {
      p_listing_id: listingId,
      p_reason: reason,
    })
    .throwOnError();

  const result = data as {
    files: { bucket: string; path: string }[];
    removal_count: number;
    banned: boolean;
  };

  const pathsByBucket = new Map<string, string[]>();
  for (const file of result.files ?? []) {
    pathsByBucket.set(file.bucket, [...(pathsByBucket.get(file.bucket) ?? []), file.path]);
  }

  for (const [bucket, paths] of pathsByBucket) {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      console.log(`Failed to remove objects from ${bucket}`, paths, error);
    }
  }

  return { removalCount: result.removal_count, banned: result.banned };
};

/** The listing is fine: drops its reports so it leaves the queue. */
export const dismissListingReports = async (listingId: number) => {
  await supabase
    .from("reports")
    .delete()
    .eq("target_type", "listing")
    .eq("listing_id", listingId)
    .throwOnError();
};
