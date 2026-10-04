// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";

export type ReportReason = "spam" | "inappropriate";

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
