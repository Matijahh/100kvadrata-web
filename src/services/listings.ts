// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import { mapProfileRowToUser } from "@/services/profile";
import { IMMUTABLE_CACHE_CONTROL } from "@/utils/mediaOptimizer";
import {
  CreateListingInput,
  CreateListingMediaInput,
  Listing,
  ListingFilters,
  ListingMedia,
  ListingSort,
} from "@/types/types";

type StorageInput = {
  fileName: string;
  fileExtension: string;
  fileBuffer: Uint8Array;
  contentType?: string;
};

type StorageUploadResult = {
  storagePath: string;
  publicUrl: string;
};

type PaginationInput = {
  // Keyset cursor of the last item on the page; see getListingFeedCursor.
  // The default feed uses only `cursorId`, a filtered one (priority_rank, id),
  // and a sorted one (priority_rank, sort value, id).
  cursorRank?: number;
  cursorValue?: number | null;
  cursorId?: number;
  limit?: number;
};

type FetchListingsInput = PaginationInput & {
  filters?: ListingFilters;
};

/** The column and direction behind each sort. "newest" orders by id. */
const SORT_ORDER: Record<
  Exclude<ListingSort, "newest">,
  { column: "effective_total_price_eur" | "effective_price_per_m2_eur"; ascending: boolean }
> = {
  priceAsc: { column: "effective_total_price_eur", ascending: true },
  priceDesc: { column: "effective_total_price_eur", ascending: false },
  pricePerM2Asc: { column: "effective_price_per_m2_eur", ascending: true },
};

const getSortOrder = (filters?: ListingFilters) =>
  filters?.sort && filters.sort !== "newest" ? SORT_ORDER[filters.sort] : null;

// The PostgREST builder's generics differ between the app and the web's
// supabase-js versions; the filters below only use methods both have.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListingQuery = any;

/** Every filter and the expiry rule, applied to a listings query. */
const applyListingFilters = (query: ListingQuery, filters?: ListingFilters): ListingQuery => {
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.listingType) {
    query = query.eq("listing_type", filters.listingType);
  }

  // Location values are canonical (picked via autocomplete), so match exactly
  // but case-insensitively to stay tolerant of older free-typed data.
  if (filters?.state?.trim()) {
    query = query.ilike("state", filters.state.trim());
  }

  if (filters?.city?.trim()) {
    query = query.ilike("city", filters.city.trim());
  }

  if (filters?.municipality?.trim()) {
    query = query.ilike("municipality", filters.municipality.trim());
  }

  if (filters?.minSurfaceM2 != null) {
    query = query.gte("surface_m2", filters.minSurfaceM2);
  }

  if (filters?.maxSurfaceM2 != null) {
    query = query.lte("surface_m2", filters.maxSurfaceM2);
  }

  if (filters?.minRooms != null) {
    query = query.gte("rooms", filters.minRooms);
  }

  if (filters?.maxRooms != null) {
    query = query.lte("rooms", filters.maxRooms);
  }

  // A sale's price_eur is per m², so a buyer who thinks in totals filters on
  // the generated total instead (a rental's total is its monthly rent).
  const priceColumn =
    filters?.priceBasis === "total" ? "effective_total_price_eur" : "price_eur";

  if (filters?.minPriceEur != null) {
    query = query.gte(priceColumn, filters.minPriceEur);
  }

  if (filters?.maxPriceEur != null) {
    query = query.lte(priceColumn, filters.maxPriceEur);
  }

  // `in`, not `eq`: a listing has exactly one orientation, but the buyer may
  // have named several they would accept, and any of them is a match.
  if (filters?.orientation?.length) {
    query = query.in("orientation", filters.orientation);
  }

  if (filters?.parking?.length) {
    query = query.in("parking", filters.parking);
  }

  if (filters?.constructionType?.length) {
    query = query.in("construction_type", filters.constructionType);
  }

  if (filters?.propertyCondition?.length) {
    query = query.in("property_condition", filters.propertyCondition);
  }

  if (filters?.storey?.length) {
    query = query.in("storey", filters.storey);
  }

  // Only 'floor' listings carry a number, so this also excludes every other
  // storey on its own — no need to pair it with the check above.
  if (filters?.storeyFloorNumber != null) {
    query = query.eq("storey_floor_number", filters.storeyFloorNumber);
  }

  // `overlaps`, not `contains`: several heating types on a listing are
  // alternatives, so matching any one of the selected ones is the useful rule.
  if (filters?.heatingTypes?.length) {
    query = query.overlaps("heating_types", filters.heatingTypes);
  }

  if (filters?.groundType?.length) {
    query = query.in("ground_type", filters.groundType);
  }

  if (filters?.furniture?.length) {
    query = query.in("furniture", filters.furniture);
  }

  if (filters?.nearbyObjects?.length) {
    query = query.contains("nearby_objects", filters.nearbyObjects);
  }

  if (filters?.additionalFeatures?.length) {
    query = query.contains("additional_features", filters.additionalFeatures);
  }

  const normalizedSearchText = normalizeSearchText(filters?.searchText);
  if (normalizedSearchText) {
    const searchPattern = buildSearchPattern(normalizedSearchText);
    query = query.or([
      `state.ilike.${searchPattern}`,
      `city.ilike.${searchPattern}`,
      `municipality.ilike.${searchPattern}`,
      `street.ilike.${searchPattern}`,
      `description.ilike.${searchPattern}`,
    ].join(","));
  }

  // Hide expired listings; legacy listings have a null expires_at (never expire).
  const nowIso = new Date().toISOString();
  query = query.or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  return query;
};

export const fetchListings = async (input: FetchListingsInput) => {
  const { cursorRank, cursorValue, cursorId, filters, limit } = input;
  // Premium/exclusive listings are only boosted when the user has narrowed the
  // feed with filters, a search or a sort. The default feed stays newest-first
  // so regular listings aren't buried under premium ones. A price sort keeps
  // them on top too (the product decision for FEAT-45): price order applies
  // within each priority level.
  const sortOrder = getSortOrder(filters);
  const usePriorityOrdering = hasActiveListingFilters(filters);

  let query = applyListingFilters(
    supabase.from("listings").select("*, media:listing_media(*)"),
    filters,
  );

  if (sortOrder) {
    query = query
      .order("priority_rank", { ascending: false })
      .order(sortOrder.column, { ascending: sortOrder.ascending, nullsFirst: false })
      .order("id", { ascending: false });
  } else if (usePriorityOrdering) {
    query = query
      .order("priority_rank", { ascending: false })
      .order("id", { ascending: false });
  } else {
    query = query.order("id", { ascending: false });
  }

  if (limit) {
    query = query.limit(limit);
  }

  // Keyset pagination: everything strictly after the last row of the
  // previous page, in the same order as above. Listings without a price to
  // sort by come last (nulls last), so a null cursor value means the page
  // ended among them.
  if (sortOrder) {
    if (cursorRank != null && cursorId != null) {
      const column = sortOrder.column;
      const afterValue =
        cursorValue == null
          ? `and(${column}.is.null,id.lt.${cursorId})`
          : `or(${column}.${sortOrder.ascending ? "gt" : "lt"}.${cursorValue},${column}.is.null,and(${column}.eq.${cursorValue},id.lt.${cursorId}))`;
      query = query.or(
        `priority_rank.lt.${cursorRank},and(priority_rank.eq.${cursorRank},${afterValue})`,
      );
    }
  } else if (usePriorityOrdering) {
    if (cursorRank != null && cursorId != null) {
      query = query.or(
        `priority_rank.lt.${cursorRank},and(priority_rank.eq.${cursorRank},id.lt.${cursorId})`,
      );
    }
  } else if (cursorId != null) {
    query = query.lt("id", cursorId);
  }

  const { data } = await query.throwOnError();

  return mapListingsWithProfiles(data ?? []);
};

/** The cursor for the page after `listing`, under the same filters and sort. */
export const getListingFeedCursor = (listing: Listing, filters?: ListingFilters) => {
  const sortOrder = getSortOrder(filters);

  return {
    cursorRank: listing.priority_rank ?? 0,
    cursorValue: sortOrder ? (listing[sortOrder.column] ?? null) : null,
    cursorId: listing.id,
  };
};

export const fetchUserListings = async (userId: string) => {
  const { data } = await supabase
    .from("listings")
    .select("*, media:listing_media(*)")
    .eq("user_id", userId)
    .order("id", { ascending: false })
    .throwOnError();

  return mapListingsWithProfiles(data ?? []);
};

export const fetchSavedListingIds = async (userId: string) => {
  const { data } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", userId)
    .throwOnError();

  return data.map((item) => item.listing_id);
};

export const fetchLikedListingIds = async (userId: string) => {
  const { data } = await supabase
    .from("liked_listings")
    .select("listing_id")
    .eq("user_id", userId)
    .throwOnError();

  return data.map((item) => item.listing_id);
};

export const fetchSavedListings = async (userId: string) => {
  const { data } = await supabase
    .from("saved_listings")
    .select(
      "listing:listings(*, media:listing_media(*))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .throwOnError();

  const listings =
    data?.map((item) => item.listing).filter(Boolean).map((listing) => ({
      ...listing,
      isSaved: true,
    })) ?? [];

  return mapListingsWithProfiles(listings);
};

export const saveListing = async (userId: string, listingId: number) => {
  await supabase
    .from("saved_listings")
    .upsert(
      {
        user_id: userId,
        listing_id: listingId,
      },
      {
        onConflict: "user_id,listing_id",
      },
    )
    .throwOnError();
};

export const unsaveListing = async (userId: string, listingId: number) => {
  await supabase
    .from("saved_listings")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .throwOnError();
};

export const likeListing = async (userId: string, listingId: number) => {
  await supabase
    .from("liked_listings")
    .upsert(
      {
        user_id: userId,
        listing_id: listingId,
      },
      {
        onConflict: "user_id,listing_id",
      },
    )
    .throwOnError();
};

export const unlikeListing = async (userId: string, listingId: number) => {
  await supabase
    .from("liked_listings")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .throwOnError();
};

// Reports that a listing was looked at. Everything that decides whether that
// is worth a point — the owner check, the 30-minute session window, the
// atomic increment — lives in the RPC (20260813_listing_views.sql), so the
// count does not depend on the client behaving.
//
// Never throws: a lost view is not worth failing a screen over, and the caller
// is a render-time effect with nothing useful to do about the error.
export const recordListingView = async (
  listingId: number,
  viewerKey: string,
) => {
  const { error } = await supabase.rpc("record_listing_view", {
    p_listing_id: listingId,
    p_viewer_key: viewerKey,
  });

  if (error) {
    console.log(`Failed to record a view for listing ${listingId}`, error);
  }
};

// Total views for the current user's own listings, keyed by listing id.
// No filter is needed: the owner-only SELECT policy on listing_view_counts
// means another user's rows are never returned, so this is also what keeps the
// counts private.
//
// `unique_viewers` is tracked alongside `views` but deliberately not selected:
// sellers are shown one number, and there is no point paying for a column
// nothing renders.
export const fetchOwnListingViewCounts = async () => {
  const { data } = await supabase
    .from("listing_view_counts")
    .select("listing_id, views")
    .throwOnError();

  return (data ?? []).reduce<Record<number, number>>((accumulator, row) => {
    accumulator[row.listing_id] = row.views ?? 0;
    return accumulator;
  }, {});
};

export const fetchListingById = async (listingId: string | number) => {
  const { data } = await supabase
    .from("listings")
    .select("*, media:listing_media(*)")
    .eq("id", listingId)
    .single()
    .throwOnError();

  const listings = await mapListingsWithProfiles([data]);

  return listings[0];
};

export const uploadPhotoToStorage = async (
  storageProps: StorageInput,
): Promise<StorageUploadResult> => {
  const { fileName, fileExtension, fileBuffer, contentType } = storageProps;

  const { error } = await supabase.storage
    .from("listing-photos")
    .upload(fileName, fileBuffer, {
      contentType: contentType ?? `image/${fileExtension}`,
      cacheControl: IMMUTABLE_CACHE_CONTROL,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("listing-photos")
    .getPublicUrl(fileName);

  return {
    storagePath: fileName,
    publicUrl: urlData.publicUrl,
  };
};

export const uploadVideoToStorage = async (
  storageProps: StorageInput,
): Promise<StorageUploadResult> => {
  const { fileName, fileExtension, fileBuffer, contentType } = storageProps;

  const { error } = await supabase.storage
    .from("listing-videos")
    .upload(fileName, fileBuffer, {
      contentType: contentType ?? getVideoContentType(fileExtension),
      cacheControl: IMMUTABLE_CACHE_CONTROL,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("listing-videos")
    .getPublicUrl(fileName);

  return {
    storagePath: fileName,
    publicUrl: urlData.publicUrl,
  };
};

export const createListing = async (newListing: CreateListingInput) => {
  const { data } = await supabase
    .from("listings")
    .insert(newListing)
    .select("*")
    .single()
    .throwOnError();

  return data;
};

export const createListingMedia = async (
  mediaRows: CreateListingMediaInput[],
) => {
  const { data } = await supabase
    .from("listing_media")
    .insert(mediaRows)
    .select("*")
    .throwOnError();

  return data;
};

// Everything an owner may change. Derived from CreateListingInput so the two
// stay in step, minus the fields the client must never write: `user_id` is
// ownership, `tier` drives priority_rank and the expiry window. The database
// pins those anyway (trg_pin_listing_lifecycle_columns), but leaving them out
// of the type stops us sending them in the first place.
// `media_mode` is excluded on purpose: it describes the photos or video the
// listing was published with, and an edit cannot change those. Keeping it out
// of the type makes a stray media write a compile error rather than a silent
// mismatch between the column and the rows in `listing_media`.
export type UpdateListingInput = Omit<
  CreateListingInput,
  "user_id" | "tier" | "media_mode"
>;

export const updateListing = async (
  listingId: number,
  fields: UpdateListingInput,
) => {
  const { data } = await supabase
    .from("listings")
    .update(fields)
    .eq("id", listingId)
    .select("*")
    .throwOnError();

  // RLS filters UPDATE per row, so a non-owner — or a project missing the
  // owner policy from 20260802_listing_edit_policy.sql — gets HTTP 200 with an
  // empty array rather than an error. Without this check the UI would report a
  // save that never happened.
  if (!data || data.length === 0) {
    throw new Error("LISTING_UPDATE_FORBIDDEN");
  }

  return data[0];
};

// Reordering only moves rows that already exist, so it never touches storage.
export const updateListingMediaSortOrder = async (
  mediaId: ListingMedia["id"],
  sortOrder: number,
) => {
  await supabase
    .from("listing_media")
    .update({ sort_order: sortOrder })
    .eq("id", mediaId)
    .throwOnError();
};

// Rollback helper for a failed edit: removes objects uploaded during the
// attempt so a retry does not leave paid-for bytes behind. Best-effort, and
// never throws — the caller is already handling a different failure.
export const removeUploadedObjects = async (
  objects: { bucket: string; path: string }[],
) => {
  await Promise.all(
    objects.map(async ({ bucket, path }) => {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        console.log(`Failed to clean up ${bucket}/${path} after a failed edit`, error);
      }
    }),
  );
};

// Drops media rows and their storage objects together. Used by the edit flow
// for media the owner removed; deleteListing reuses the storage half.
export const deleteListingMedia = async (media: ListingMedia[]) => {
  if (media.length === 0) {
    return;
  }

  const mediaIds = media.map((mediaItem) => mediaItem.id).filter(Boolean);

  if (mediaIds.length > 0) {
    await supabase
      .from("listing_media")
      .delete()
      .in("id", mediaIds)
      .throwOnError();
  }

  await removeListingMediaFromStorage(media);
};

// Storage cleanup is best-effort and never fails the caller: the DB rows are
// already gone, and a retry would not bring them back. Orphans are logged
// rather than left silently — the project has had egress problems.
const removeListingMediaFromStorage = async (
  media: ListingMedia[] | null | undefined,
) => {
  const pathsFor = (kind: ListingMedia["kind"]) =>
    (media ?? [])
      .filter((mediaItem) => mediaItem.kind === kind)
      .map((mediaItem) => mediaItem.storage_path)
      .filter(Boolean);

  const buckets: [string, string[]][] = [
    ["listing-photos", pathsFor("photo")],
    ["listing-videos", pathsFor("video")],
  ];

  for (const [bucket, paths] of buckets) {
    if (paths.length === 0) {
      continue;
    }

    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      console.log(`Failed to remove objects from ${bucket}`, paths, error);
    }
  }
};

export const deleteListingById = async (listingId: number) => {
  await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .throwOnError();
};

export const deleteListing = async (listing: Listing) => {
  await supabase
    .from("listings")
    .delete()
    .eq("id", listing.id)
    .throwOnError();

  await removeListingMediaFromStorage(listing.media);
};

const normalizeListingMedia = (media: ListingMedia[] | null | undefined) =>
  [...(media ?? [])].sort((firstItem, secondItem) => {
    return firstItem.sort_order - secondItem.sort_order;
  });

const mapListingRow = (
  listing: any,
  userMap: Record<string, Listing["user"]>,
  likeCountsMap: Record<number, number>,
) => {
  const media = normalizeListingMedia(listing.media);

  return {
    ...listing,
    media,
    likeCount: likeCountsMap[listing.id] ?? 0,
    video_url:
      media.find((mediaItem) => mediaItem.kind === "video")?.public_url ??
      listing.video_url ??
      null,
    user: userMap[listing.user_id],
  };
};

// Exported for reports.ts, which reads listings through an RPC rather than a
// table select and needs the same owner and like-count enrichment.
export const mapListingsWithProfiles = async (listings: any[]): Promise<Listing[]> => {
  const userIds = [...new Set(listings.map((listing) => listing.user_id).filter(Boolean))];
  const listingIds = listings.map((listing) => listing.id).filter(Boolean);
  const [userMap, likeCountsMap] = await Promise.all([
    fetchProfilesMap(userIds),
    fetchLikeCountsMap(listingIds),
  ]);

  return listings.map((listing) => mapListingRow(listing, userMap, likeCountsMap));
};

const fetchProfilesMap = async (userIds: string[]) => {
  if (userIds.length === 0) {
    return {};
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds)
    .throwOnError();

  return (data ?? []).reduce<Record<string, Listing["user"]>>((accumulator, profile) => {
    accumulator[profile.id] = mapProfileRowToUser(profile);
    return accumulator;
  }, {});
};

const fetchLikeCountsMap = async (listingIds: number[]) => {
  if (listingIds.length === 0) {
    return {};
  }

  const { data } = await supabase
    .from("liked_listings")
    .select("listing_id")
    .in("listing_id", listingIds)
    .throwOnError();

  return (data ?? []).reduce<Record<number, number>>((accumulator, likeRow) => {
    const listingId = likeRow.listing_id;
    accumulator[listingId] = (accumulator[listingId] ?? 0) + 1;
    return accumulator;
  }, {});
};

const getVideoContentType = (fileExtension: string) => {
  const normalizedExtension = fileExtension.toLowerCase();

  switch (normalizedExtension) {
    case "mov":
      return "video/quicktime";
    case "m4v":
      return "video/x-m4v";
    case "webm":
      return "video/webm";
    case "mp4":
    default:
      return "video/mp4";
  }
};

// True when any listing filter or search term is set. Used to decide whether
// premium priority ordering applies (it does not on the default feed), and
// whether marketing posts are mixed in (they are only on the default feed).
export const hasActiveListingFilters = (filters?: ListingFilters): boolean => {
  if (!filters) {
    return false;
  }

  return Boolean(
    filters.category ||
      filters.listingType ||
      filters.state?.trim() ||
      filters.city?.trim() ||
      filters.municipality?.trim() ||
      filters.minSurfaceM2 != null ||
      filters.maxSurfaceM2 != null ||
      filters.minRooms != null ||
      filters.maxRooms != null ||
      filters.minPriceEur != null ||
      filters.maxPriceEur != null ||
      // Length checks, not truthiness: these are arrays now, and an empty one
      // is still an object — reading it as "a filter is set" would switch the
      // default feed onto priority ordering for everyone.
      filters.orientation?.length ||
      filters.parking?.length ||
      filters.constructionType?.length ||
      filters.propertyCondition?.length ||
      filters.storey?.length ||
      filters.storeyFloorNumber != null ||
      filters.heatingTypes?.length ||
      filters.groundType?.length ||
      filters.furniture?.length ||
      filters.nearbyObjects?.length ||
      filters.additionalFeatures?.length ||
      (filters.sort != null && filters.sort !== "newest") ||
      normalizeSearchText(filters.searchText),
  );
};

const normalizeSearchText = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
};

const buildSearchPattern = (value: string) => `%${normalizeSearchText(value)}%`;

/**
 * Whether a listing is live, i.e. in the feed: not archived or deleted, and
 * not past its expiry (the hourly job archives it some time after that).
 */
export const isListingLive = (
  listing: Pick<Listing, "status" | "expires_at">,
  now: number = Date.now(),
) =>
  (listing.status == null || listing.status === "active") &&
  (!listing.expires_at || new Date(listing.expires_at).getTime() > now);

/**
 * Puts an expired listing back in the feed. During the free launch this is
 * free and gives another 30 days, the same as publishing; a listing credit is
 * spent if the owner has one (see 20261126_free_launch_reactivation.sql).
 */
export const reactivateListing = async (listingId: number) => {
  const { data } = await supabase
    .rpc("reactivate_listing", { p_listing_id: listingId })
    .throwOnError();

  return data as Listing;
};
