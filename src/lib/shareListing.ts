// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Single source of truth for a listing's public link.
//
// This is an https Universal / App Link. Once 100-kvadrata.rs serves the
// .well-known files (see SHARE_LINKS_SETUP.md), tapping it opens the app
// straight on the listing; until then it resolves to the web listing page.
// We deliberately share an https URL rather than the `stokvadrata://` scheme
// because messaging apps only make https links tappable.
export const LISTING_URL_HOST = "https://100-kvadrata.rs";

export const buildListingUrl = (listingId: number | string): string =>
  `${LISTING_URL_HOST}/listing/${listingId}`;
