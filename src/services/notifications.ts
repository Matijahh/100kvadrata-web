// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import { mapProfileRowToUser } from "@/services/profile";
import { Notification } from "@/types/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapNotificationRow = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  actorId: row.actor_id,
  actor: row.actor ? mapProfileRowToUser(row.actor) : null,
  listingId: row.listing_id,
  isRead: row.is_read,
  createdAt: row.created_at,
});

export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const { data } = await supabase
    .from("notifications")
    .select("*, actor:profiles!actor_id(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)
    .throwOnError();

  return (data ?? []).map(mapNotificationRow);
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .throwOnError();
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .throwOnError();
};

/**
 * Stores the device's Expo push token in `profile_private`, which RLS limits to
 * its owner. It lived on `profiles` until FIX-14, where every authenticated
 * user could read it — and the token is all Expo needs to deliver a push.
 *
 * Upsert rather than update: a user who has never saved a phone number has no
 * `profile_private` row yet. Only `push_token` is written, so an existing phone
 * on that row is left alone.
 */
export const savePushToken = async (userId: string, token: string): Promise<void> => {
  await supabase
    .from("profile_private")
    .upsert(
      { id: userId, push_token: token, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    )
    .throwOnError();
};
