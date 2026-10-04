// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import {
  AccountType,
  AppLanguage,
  AppThemePreference,
  Profile,
} from "@/types/types";
import { normalizeExternalUrl } from "@/utils/externalLinks";
import {
  IMAGE_PRESETS,
  IMMUTABLE_CACHE_CONTROL,
  optimizeImage,
} from "@/utils/mediaOptimizer";

type ProfileRow = {
  id: string;
  updated_at: string | null;
  username: string;
  full_name: string | null;
  bio: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  avatar_url: string | null;
  phone: string | null;
  phone_public: boolean | null;
  city: string | null;
  agency_name: string | null;
  website_url: string | null;
  preferred_language: AppLanguage | null;
  preferred_theme: AppThemePreference | null;
  is_exclusive: boolean | null;
  account_type: AccountType | null;
};

export type UpdateProfileInput = {
  username: string;
  fullName: string;
  bio: string;
  instagramUrl: string;
  youtubeUrl: string;
  phone: string;
  phonePublic: boolean;
  city: string;
  agencyName: string;
  websiteUrl: string;
  avatarUrl?: string | null;
  accountType: AccountType;
};

export type UpdateProfilePreferencesInput = {
  preferredLanguage?: AppLanguage | null;
  preferredTheme?: AppThemePreference | null;
};

const AVATAR_BUCKET = "avatars";

export const mapProfileRowToUser = (
  profile: ProfileRow,
): Profile => ({
  id: profile.id,
  username: profile.username,
  updatedAt: profile.updated_at,
  fullName: profile.full_name,
  bio: profile.bio,
  instagramUrl: profile.instagram_url,
  youtubeUrl: profile.youtube_url,
  avatarUrl: profile.avatar_url,
  // `?? null` rather than a bare read: a profile fetched before this migration
  // ran has the key missing entirely, and `undefined` would make the edit form
  // treat it as "not loaded yet" instead of "empty".
  city: profile.city ?? null,
  agencyName: profile.agency_name ?? null,
  websiteUrl: profile.website_url ?? null,
  // The published copy. `fetchProfile` overwrites this with the real number
  // when the reader is the owner.
  phone: profile.phone ?? null,
  phonePublic: profile.phone_public ?? false,
  preferredLanguage: profile.preferred_language,
  preferredTheme: profile.preferred_theme,
  // Read-only here. `updateProfile` never sends it, and the database pins it
  // against app writes regardless — it is granted in the SQL editor.
  isExclusive: profile.is_exclusive ?? false,
  // Null only for a row read from a database where the account-type migration
  // has not run. Callers treat that as "not answered yet" rather than
  // defaulting, so nobody is silently shown the wrong half of the app.
  accountType: profile.account_type ?? null,
});

export const fetchProfile = async (userId: string) => {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
    .throwOnError();

  const profile = mapProfileRowToUser(data as ProfileRow);

  // The owner's real number lives in `profile_private`, which RLS restricts to
  // `id = auth.uid()`. Asking for it unconditionally is safe and saves a
  // session lookup: reading someone else's profile simply returns no row, so
  // `profile.phone` stays whatever they chose to publish. Not `throwOnError` —
  // a failure here must not take down the whole profile screen.
  const { data: privateRow } = await supabase
    .from("profile_private")
    .select("phone")
    .eq("id", userId)
    .maybeSingle();

  if (privateRow) {
    profile.phone = (privateRow as { phone: string | null }).phone ?? null;
  }

  return profile;
};

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
) => {
  const phone = input.phone.trim() || null;

  // Private table first: it is the source of truth for the user's own number.
  // If the second write then fails the user sees a save error and retries,
  // leaving the published copy merely stale rather than showing a number the
  // owner no longer has on file.
  await supabase
    .from("profile_private")
    .upsert(
      { id: userId, phone, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    )
    .throwOnError();

  const { data } = await supabase
    .from("profiles")
    .update({
      username: input.username,
      full_name: input.fullName || null,
      bio: input.bio || null,
      instagram_url: normalizeExternalUrl(input.instagramUrl) || null,
      youtube_url: normalizeExternalUrl(input.youtubeUrl) || null,
      // Only ever holds a number the owner chose to publish.
      phone: input.phonePublic ? phone : null,
      phone_public: input.phonePublic,
      city: input.city || null,
      agency_name: input.agencyName || null,
      website_url: normalizeExternalUrl(input.websiteUrl) || null,
      avatar_url: input.avatarUrl ?? null,
      // Saved with the rest of the form rather than applied on tap: switching
      // type reshapes the whole app, so it should take the same deliberate
      // save as changing a username, and be abandonable by backing out.
      account_type: input.accountType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single()
    .throwOnError();

  const updated = mapProfileRowToUser(data as ProfileRow);

  // The row we just read back carries the published copy, which is null while
  // the number is private. The caller is the owner, so hand back their real
  // number instead — otherwise the edit form blanks the field on save.
  updated.phone = phone;

  return updated;
};

/**
 * The type on its own, for onboarding — which asks the question before the
 * user has a profile form in front of them to save it with.
 */
export const updateAccountType = async (
  userId: string,
  accountType: AccountType,
): Promise<void> => {
  await supabase
    .from("profiles")
    .update({ account_type: accountType, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .throwOnError();
};

export const updateProfilePreferences = async (
  userId: string,
  input: UpdateProfilePreferencesInput,
) => {
  const updates: Record<string, string | null> = {};

  if (input.preferredLanguage !== undefined) {
    updates.preferred_language = input.preferredLanguage;
  }

  if (input.preferredTheme !== undefined) {
    updates.preferred_theme = input.preferredTheme;
  }

  const { data } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single()
    .throwOnError();

  return mapProfileRowToUser(data as ProfileRow);
};

export const deleteAccount = async () => {
  const { error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
  });

  if (error) {
    throw error;
  }
};

export const uploadAvatar = async (userId: string, imageUri: string) => {
  const optimized = await optimizeImage(imageUri, IMAGE_PRESETS.avatar);

  const response = await fetch(optimized.uri);
  const fileBuffer = await response.arrayBuffer();
  const filePath = `${userId}/avatar.${optimized.extension}`;

  // Safe to cache long-term despite the fixed path and `upsert`, because the
  // returned URL carries a `?t=` cache-buster that is persisted to
  // `avatar_url` — a new upload produces a new URL.
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: optimized.mimeType,
      upsert: true,
      cacheControl: IMMUTABLE_CACHE_CONTROL,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

  return `${data.publicUrl}?t=${Date.now()}`;
};
