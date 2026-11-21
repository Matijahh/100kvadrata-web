// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { Listing, MarketingPost } from "@/types/types";

// Mixing admin marketing posts into the listings feed (FEAT-42). Pure, shared
// with the web app.

/** One marketing post after every this many listings. */
export const MARKETING_POST_INTERVAL = 5;

export type FeedEntry =
  | { kind: "listing"; key: string; listing: Listing }
  | { kind: "post"; key: string; post: MarketingPost };

/**
 * Puts a post after every `interval` listings, cycling through `posts` (they
 * arrive newest first). Positions depend only on how many listings came before,
 * so loading the next page never moves a post that is already on screen.
 *
 * Callers pass no posts for a filtered or searched feed: posts are never part
 * of search results.
 */
export const mixMarketingPosts = (
  listings: Listing[],
  posts: MarketingPost[],
  interval: number = MARKETING_POST_INTERVAL,
): FeedEntry[] => {
  const entries: FeedEntry[] = [];

  listings.forEach((listing, index) => {
    entries.push({ kind: "listing", key: `listing-${listing.id}`, listing });

    const listingsSoFar = index + 1;
    if (posts.length > 0 && listingsSoFar % interval === 0) {
      const slot = listingsSoFar / interval - 1;
      const post = posts[slot % posts.length];
      entries.push({ kind: "post", key: `post-${post.id}-${slot}`, post });
    }
  });

  return entries;
};
