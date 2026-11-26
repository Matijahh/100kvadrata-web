// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import type { BuyerFilters, ListingFilters } from "@/types/types";

export const queryKeys = {
  listings: ["listings"] as const,
  listingFeed: (filters: ListingFilters) => ["listings", filters] as const,
  listing: (listingId: string) => ["listing", listingId] as const,
  userListings: (userId: string) => ["userListings", userId] as const,
  savedListings: (userId: string) => ["savedListings", userId] as const,
  savedSearches: (userId: string) => ["savedSearches", userId] as const,
  listingViewCounts: (userId: string) => ["listingViewCounts", userId] as const,
  savedListingIds: (userId: string) => ["savedListingIds", userId] as const,
  likedListingIds: (userId: string) => ["likedListingIds", userId] as const,
  profile: (userId: string) => ["profile", userId] as const,
  conversations: (userId: string) => ["conversations", userId] as const,
  conversation: (conversationId: string) => ["conversation", conversationId] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  // Both start with "marketingPosts" so one invalidation refreshes the feed
  // and the admin's own list.
  feedMarketingPosts: ["marketingPosts", "feed"] as const,
  ownMarketingPosts: (userId: string) => ["marketingPosts", "own", userId] as const,
  // Admin-only (FEAT-43). Not per user: every admin sees the same queue.
  flaggedListings: ["flaggedListings"] as const,
  // Admin-only "Admin igra". Per user: the board puts each admin's own
  // character first.
  growthProgress: (userId: string) => ["growthProgress", userId] as const,
  // Admin-only "Statistika" tab. Not per user: every admin sees the same
  // numbers; one entry per period.
  adminStats: (days: number) => ["adminStats", days] as const,
  preferenceSets: (userId: string) => ["preferenceSets", userId] as const,
  preferenceSet: (userId: string, preferenceSetId: string) =>
    ["preferenceSets", userId, preferenceSetId] as const,
  buyers: (filters: BuyerFilters, currentUserId: string | null) =>
    ["buyers", currentUserId, filters] as const,
  listingCredits: (userId: string) => ["listingCredits", userId] as const,
  blockedUserIds: (userId: string) => ["blockedUserIds", userId] as const,
  buyersAccess: (userId: string) => ["buyersAccess", userId] as const,
  activeCountries: ["activeCountries"] as const,
  citySearch: (countryCode: string, query: string) =>
    ["citySearch", countryCode, query] as const,
  municipalitySearch: (countryCode: string, city: string, query: string) =>
    ["municipalitySearch", countryCode, city, query] as const,
  streetSearch: (
    countryCode: string,
    city: string,
    municipality: string,
    query: string
  ) => ["streetSearch", countryCode, city, municipality, query] as const,
};
