// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import { mapProfileRowToUser } from "@/services/profile";
import { fetchBlockedUserIds } from "@/services/reports";
import i18n from "@/i18n";
import {
  Conversation,
  Listing,
  Message,
  MessageAttachment,
  MessageListing,
} from "@/types/types";
import { uploadLocalFile } from "@/lib/storageUpload";
import { getListingPriceLabel } from "@/utils/listingPrice";
import {
  IMAGE_PRESETS,
  optimizeImage,
  optimizeVideo,
} from "@/utils/mediaOptimizer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapConversationRow = (row: any, currentUserId: string): Conversation => {
  const otherUserRow =
    row.user1_id === currentUserId ? row.user2 : row.user1;
  return {
    id: row.id,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    listingId: row.listing_id,
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
    otherUser: mapProfileRowToUser(otherUserRow),
    unreadCount: 0,
  };
};

// Built when messages are fetched, outside any component, so it reads the
// language straight from i18n rather than through useTranslation.
const buildListingDisplayText = (
  l: Pick<
    Listing,
    "city" | "street" | "price_eur" | "total_price_eur" | "surface_m2" | "listing_type"
  >,
): string => {
  const address = [l.city, l.street].filter(Boolean).join(", ");
  const price = getListingPriceLabel(l, (key) => i18n.t(key));
  return [address, price].filter(Boolean).join(" — ");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapMessageRow = (row: any): Message => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  content: row.content ?? null,
  createdAt: row.created_at,
  isRead: row.is_read,
  listing: row.listing
    ? ({ id: row.listing.id, displayText: buildListingDisplayText(row.listing) } satisfies MessageListing)
    : null,
  attachments: ((row.attachments ?? []) as any[]).map(
    (a): MessageAttachment => ({
      id: a.id,
      messageId: a.message_id,
      url: a.url,
      mediaType: a.media_type,
    }),
  ),
});

const CONVERSATION_SELECT =
  "*, user1:profiles!user1_id(*), user2:profiles!user2_id(*)";

export const fetchConversationById = async (
  conversationId: string,
  currentUserId: string,
): Promise<Conversation> => {
  const { data } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", conversationId)
    .single()
    .throwOnError();

  return mapConversationRow(data!, currentUserId);
};

export const findOrCreateConversation = async (
  currentUserId: string,
  otherUserId: string,
  listingId?: number,
): Promise<Conversation> => {
  const [user1_id, user2_id] =
    currentUserId < otherUserId
      ? [currentUserId, otherUserId]
      : [otherUserId, currentUserId];

  const { data: existing } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("user1_id", user1_id)
    .eq("user2_id", user2_id)
    .maybeSingle()
    .throwOnError();

  if (existing) {
    return mapConversationRow(existing, currentUserId);
  }

  const { data: created } = await supabase
    .from("conversations")
    .insert({ user1_id, user2_id, listing_id: listingId ?? null })
    .select(CONVERSATION_SELECT)
    .single()
    .throwOnError();

  return mapConversationRow(created!, currentUserId);
};

export const fetchConversations = async (
  userId: string,
): Promise<Conversation[]> => {
  const [{ data: allRows }, blockedIds] = await Promise.all([
    supabase
      .from("conversations")
      .select(CONVERSATION_SELECT)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false })
      .throwOnError(),
    fetchBlockedUserIds(userId),
  ]);

  const blockedIdsSet = new Set(blockedIds);
  const rows = (allRows ?? []).filter((row: any) => {
    const otherUserId = row.user1_id === userId ? row.user2_id : row.user1_id;
    return !blockedIdsSet.has(otherUserId);
  });

  if (rows.length === 0) return [];

  const conversationIds = rows.map((r: any) => r.id);

  const [lastMsgsResult, unreadResult] = await Promise.all([
    supabase
      .from("messages")
      .select("conversation_id, content")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", conversationIds)
      .eq("is_read", false)
      .neq("sender_id", userId),
  ]);

  const lastMessageMap: Record<string, string> = {};
  // Tracked separately from lastMessageMap: an attachment-only message has
  // content === null, so a photo-only conversation has messages but no entry
  // in lastMessageMap. Using that map to test emptiness would hide it.
  const conversationsWithMessages = new Set<string>();
  for (const msg of lastMsgsResult.data ?? []) {
    conversationsWithMessages.add(msg.conversation_id);
    if (!lastMessageMap[msg.conversation_id]) {
      lastMessageMap[msg.conversation_id] = msg.content;
    }
  }

  const unreadCountMap: Record<string, number> = {};
  for (const msg of unreadResult.data ?? []) {
    unreadCountMap[msg.conversation_id] =
      (unreadCountMap[msg.conversation_id] ?? 0) + 1;
  }

  // Opening a chat creates the conversation row immediately, before anything is
  // sent (see findOrCreateConversation callers), so backing out of a chat leaves
  // an empty conversation visible to both users. Hide those until creation is
  // made lazy — see B-LOG-08.
  return rows
    .filter((row: any) => conversationsWithMessages.has(row.id))
    .map((row: any) => ({
      ...mapConversationRow(row, userId),
      lastMessage: lastMessageMap[row.id],
      unreadCount: unreadCountMap[row.id] ?? 0,
    }));
};

const MESSAGE_SELECT =
  "*, listing:listings(id, city, street, price_eur, total_price_eur, surface_m2, listing_type), attachments:message_attachments(*)";

export const fetchMessages = async (
  conversationId: string,
): Promise<Message[]> => {
  const { data } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .throwOnError();

  return (data ?? []).map(mapMessageRow);
};

export const fetchMessageById = async (messageId: string): Promise<Message> => {
  const { data } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("id", messageId)
    .single()
    .throwOnError();

  return mapMessageRow(data!);
};

export type SendMessagePayload = {
  content: string | null;
  listingId?: number | null;
  attachments?: Array<{ uri: string; mimeType: string; mediaType: "image" | "video" }>;
};

const uploadChatMedia = async (
  conversationId: string,
  att: { uri: string; mimeType: string; mediaType: "image" | "video" },
): Promise<{ url: string; media_type: string }> => {
  // Resize/compress before upload so chat storage stays small and media loads
  // fast in bubbles. Falls back to the original if optimization fails.
  const optimized =
    att.mediaType === "video"
      ? await optimizeVideo(att.uri)
      : await optimizeImage(att.uri, IMAGE_PRESETS.chatImage);

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${optimized.extension}`;
  const path = `${conversationId}/${filename}`;

  await uploadLocalFile({
    bucket: "chat-media",
    path,
    uri: optimized.uri,
    contentType: optimized.mimeType,
  });

  const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(path);
  return { url: publicUrl, media_type: att.mediaType };
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  payload: SendMessagePayload,
): Promise<Message> => {
  // Upload files first so attachment rows exist before the message INSERT triggers
  // any downstream reads (avoids race with realtime / polling consumers).
  const uploadedFiles = payload.attachments?.length
    ? await Promise.all(payload.attachments.map((att) => uploadChatMedia(conversationId, att)))
    : [];

  const { data: message } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: payload.content || null,
      listing_id: payload.listingId ?? null,
    })
    .select("id, created_at")
    .single()
    .throwOnError();

  if (uploadedFiles.length) {
    await supabase
      .from("message_attachments")
      .insert(uploadedFiles.map((f) => ({ message_id: message!.id, ...f })))
      .throwOnError();
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: message!.created_at })
    .eq("id", conversationId)
    .throwOnError();

  return fetchMessageById(message!.id);
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string,
): Promise<void> => {
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("is_read", false)
    .neq("sender_id", userId)
    .throwOnError();
};
