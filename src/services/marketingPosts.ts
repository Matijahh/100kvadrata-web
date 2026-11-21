// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import { uploadLocalFile } from "@/lib/storageUpload";
import { mapProfileRowToUser } from "@/services/profile";
import { MarketingPost, MarketingPostMedia } from "@/types/types";
import {
  IMAGE_PRESETS,
  optimizeImage,
  optimizeVideo,
} from "@/utils/mediaOptimizer";

// Admin marketing posts (FEAT-42). Shared with the web app: uploads go through
// the `@/lib/storageUpload` and `@/utils/mediaOptimizer` adapters, so this file
// stays free of platform code.
//
// Only admins can write (RLS checks profiles.is_admin); everyone reads active
// posts, and an admin also reads their own hidden ones.

export const MARKETING_MEDIA_BUCKET = "marketing-media";

/** Same as the listing photo limit. */
export const MARKETING_POST_MAX_PHOTOS = 15;

/** Matches the bucket's file_size_limit (20261122_admin_accounts.sql). */
export const MARKETING_POST_MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/**
 * How many posts the feed loads to mix in. The feed shows one after every
 * MARKETING_POST_INTERVAL listings and cycles through these, newest first.
 */
const FEED_POST_LIMIT = 20;

const POST_SELECT = "*, media:marketing_post_media(*), user:profiles!user_id(*)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapPostRow = (row: any): MarketingPost => ({
  id: row.id,
  user_id: row.user_id,
  description: row.description,
  media_mode: row.media_mode,
  is_active: row.is_active,
  created_at: row.created_at,
  media: [...((row.media ?? []) as MarketingPostMedia[])].sort(
    (a, b) => a.sort_order - b.sort_order,
  ),
  user: row.user ? mapProfileRowToUser(row.user) : undefined,
});

/** Active posts for the feed, newest first. */
export const fetchFeedMarketingPosts = async (): Promise<MarketingPost[]> => {
  const { data } = await supabase
    .from("marketing_posts")
    .select(POST_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(FEED_POST_LIMIT)
    .throwOnError();

  return (data ?? []).map(mapPostRow);
};

/** Every post an admin has published, hidden ones included. */
export const fetchOwnMarketingPosts = async (
  userId: string,
): Promise<MarketingPost[]> => {
  const { data } = await supabase
    .from("marketing_posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .throwOnError();

  return (data ?? []).map(mapPostRow);
};

export type CreateMarketingPostInput = {
  userId: string;
  description: string;
} & (
  | { mediaMode: "photos"; photoUris: string[] }
  | { mediaMode: "video"; videoUri: string }
);

/**
 * Thrown codes, translated by the screens. `uploadFailed` is followed by
 * ": <the underlying error>" so the admin (and we) can see what went wrong.
 */
export const MARKETING_POST_ERRORS = {
  videoTooLarge: "MARKETING_VIDEO_TOO_LARGE",
  uploadFailed: "MARKETING_UPLOAD_FAILED",
} as const;

const publicUrlFor = (path: string) =>
  supabase.storage.from(MARKETING_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

/**
 * Creates the post row, uploads its media and links it. If any upload fails
 * the row (and whatever did upload) is removed, so a post never goes live
 * without its media.
 */
export const createMarketingPost = async (
  input: CreateMarketingPostInput,
): Promise<MarketingPost> => {
  const { data: created } = await supabase
    .from("marketing_posts")
    .insert({
      user_id: input.userId,
      description: input.description.trim(),
      media_mode: input.mediaMode,
    })
    .select("*")
    .single()
    .throwOnError();

  const postId = (created as { id: number }).id;
  const uploadedPaths: string[] = [];

  try {
    const sources =
      input.mediaMode === "photos"
        ? input.photoUris.map((uri) => ({ uri, kind: "photo" as const }))
        : [{ uri: input.videoUri, kind: "video" as const }];

    const rows = await Promise.all(
      sources.map(async ({ uri, kind }, index) => {
        const optimized =
          kind === "video"
            ? await optimizeVideo(uri)
            : await optimizeImage(uri, IMAGE_PRESETS.listingPhoto);
        const fileName =
          kind === "video"
            ? `video.${optimized.extension}`
            : `photo-${index + 1}.${optimized.extension}`;
        const path = `${input.userId}/${postId}/${fileName}`;

        await uploadLocalFile({
          bucket: MARKETING_MEDIA_BUCKET,
          path,
          uri: optimized.uri,
          contentType: optimized.mimeType,
        });
        uploadedPaths.push(path);

        return {
          post_id: postId,
          kind,
          storage_path: path,
          public_url: publicUrlFor(path),
          sort_order: index,
        };
      }),
    );

    await supabase.from("marketing_post_media").insert(rows).throwOnError();
  } catch (error) {
    await supabase.from("marketing_posts").delete().eq("id", postId);
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(MARKETING_MEDIA_BUCKET).remove(uploadedPaths);
    }

    const message =
      (error as { message?: unknown } | null)?.message != null
        ? String((error as { message: unknown }).message)
        : String(error ?? "");
    console.warn("createMarketingPost: media step failed", error);
    // The bucket answers 413 / "exceeded the maximum allowed size".
    if (/maximum allowed size|413/i.test(message)) {
      throw new Error(MARKETING_POST_ERRORS.videoTooLarge);
    }
    throw new Error(`${MARKETING_POST_ERRORS.uploadFailed}: ${message}`);
  }

  const { data } = await supabase
    .from("marketing_posts")
    .select(POST_SELECT)
    .eq("id", postId)
    .single()
    .throwOnError();

  return mapPostRow(data);
};

/** Hides a post from the feed, or puts it back. */
export const setMarketingPostActive = async (
  postId: number,
  isActive: boolean,
): Promise<void> => {
  await supabase
    .from("marketing_posts")
    .update({ is_active: isActive })
    .eq("id", postId)
    .throwOnError();
};

/** Deletes the post, its media rows (cascade) and its files. */
export const deleteMarketingPost = async (post: MarketingPost): Promise<void> => {
  await supabase.from("marketing_posts").delete().eq("id", post.id).throwOnError();

  const paths = post.media.map((item) => item.storage_path).filter(Boolean);
  if (paths.length > 0) {
    const { error } = await supabase.storage.from(MARKETING_MEDIA_BUCKET).remove(paths);
    if (error) {
      // The post is already gone; a leftover file only costs storage.
      console.log("Failed to remove marketing post media", paths, error);
    }
  }
};
