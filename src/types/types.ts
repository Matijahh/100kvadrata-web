// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
export type SessionUser = {
  id: string;
  email: string | null;
};

export type AppLanguage = "en" | "sr";

export type AppThemePreference = "light" | "dark" | "system";

export type Profile = {
  id: string;
  username: string;
  updatedAt?: string | null;
  fullName?: string | null;
  bio?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  avatarUrl?: string | null;
  // City, agency and website live on `profiles` and are public.
  city?: string | null;
  agencyName?: string | null;
  websiteUrl?: string | null;
  // The owner's real number when reading your own profile, the published copy
  // when reading someone else's (null if they keep it private). `phonePublic`
  // is what decides whether it may be shown — see the visibility note in
  // supabase/migrations/20260814_profile_contact_fields.sql.
  phone?: string | null;
  phonePublic?: boolean;
  preferredLanguage?: AppLanguage | null;
  preferredTheme?: AppThemePreference | null;
  // Set in the database only (see 20260815_exclusive_profiles.sql) — a trigger
  // pins it against writes from the app, so nobody can award it to themselves.
  // Every listing this profile publishes shows the Exclusive badge.
  isExclusive?: boolean;
  // Buyer or seller — the single answer that decides which half of the app a
  // person gets. See ACCOUNT_TYPE_VALUES.
  accountType?: AccountType | null;
};

export type CurrentUser = SessionUser & Profile;

// "apartments" must stay first: the feed reads LISTING_CATEGORY_VALUES[0] as
// the category to fall back on when none is chosen.
export const LISTING_CATEGORY_VALUES = [
  "apartments",
  "houses",
  "garages",
  "holiday homes",
  "rural estates",
  "parking spaces",
  "commercial spaces",
  "halls and warehouses",
  "plots and land",
  "agricultural land",
] as const;
export type ListingCategory = (typeof LISTING_CATEGORY_VALUES)[number];

export const LISTING_TYPE_VALUES = ["forRent", "forSale"] as const;
export type ListingType = (typeof LISTING_TYPE_VALUES)[number];

export const LISTING_ORIENTATION_VALUES = [
  "north",
  "south",
  "west",
  "east",
  "northeast",
  "northwest",
  "southeast",
  "soutwest",
] as const;
export type ListingOrientation = (typeof LISTING_ORIENTATION_VALUES)[number];

export const LISTING_PARKING_VALUES = [
  "garage parking space",
  "garage",
  "covered parking space",
  "uncovered parking space",
] as const;
export type ListingParking = (typeof LISTING_PARKING_VALUES)[number];

export const LISTING_CONSTRUCTION_TYPE_VALUES = [
  "new build",
  "old build",
] as const;
export type ListingConstructionType =
  (typeof LISTING_CONSTRUCTION_TYPE_VALUES)[number];

export const LISTING_PROPERTY_CONDITION_VALUES = [
  "original condition",
  "under construction",
  "renovated",
  "needs renovation",
  "luxury",
] as const;
export type ListingPropertyCondition =
  (typeof LISTING_PROPERTY_CONDITION_VALUES)[number];

// "floor" is the catch-all: pick it and type the number in
// `storey_floor_number`. The others stand on their own.
export const LISTING_STOREY_VALUES = [
  "basement",
  "semi-basement",
  "low ground floor",
  "ground floor",
  "high ground floor",
  "attic",
  "floor",
] as const;
export type ListingStorey = (typeof LISTING_STOREY_VALUES)[number];

export const LISTING_HEATING_VALUES = [
  "central",
  "air conditioning",
  "own boiler",
  "heat pump",
  "electricity",
  "gas",
  "marble radiators",
  "norwegian radiators",
  "solid fuel",
  "storage heater",
  "tile stove",
  "underfloor",
] as const;
export type ListingHeating = (typeof LISTING_HEATING_VALUES)[number];

// Parking and a garage are deliberately absent: `LISTING_PARKING_VALUES` above
// already covers them, and in more detail than a yes/no chip could.
export const LISTING_ADDITIONAL_FEATURE_VALUES = [
  "move-in ready",
  "internet",
  "intercom",
  "terrace",
  "basement",
  "french balcony",
  "cable tv",
  "duplex",
  "air conditioning",
  "penthouse",
  "energy certificate",
  "video surveillance",
  "registered",
  "mortgaged",
  "elevator",
  "wheelchair access",
  "vat refund",
] as const;
export type ListingAdditionalFeature =
  (typeof LISTING_ADDITIONAL_FEATURE_VALUES)[number];

export const LISTING_GROUND_VALUES = [
  "ceramic tiles",
  "parquet",
  "tarket",
  "laminate",
  "itison",
  "other",
] as const;
export type ListingGround = (typeof LISTING_GROUND_VALUES)[number];

export const LISTING_FURNITURE_VALUES = [
  "furnished",
  "semi-furnished",
  "empty",
] as const;
export type ListingFurniture = (typeof LISTING_FURNITURE_VALUES)[number];

export const LISTING_NEARBY_OBJECT_VALUES = [
  "kindergarden",
  "elementary school",
  "high school",
  "hospital",
  "church",
  "park",
  "grocery store",
  "pharmacy",
  "gym",
] as const;
export type ListingNearbyObject = (typeof LISTING_NEARBY_OBJECT_VALUES)[number];

export type ListingMediaMode = "photos" | "video";

export type ListingMediaKind = "photo" | "video";

export const PACKAGE_TIER_VALUES = [
  "standard",
  "premium",
  "exclusive",
  "exclusive_plus",
] as const;
export type PackageTier = (typeof PACKAGE_TIER_VALUES)[number];

export type Country = {
  code: string;
  name: string;
};

export type ListingMedia = {
  id: string;
  listing_id: number;
  kind: ListingMediaKind;
  storage_path: string;
  public_url: string;
  sort_order: number;
  created_at: string;
};

export type Listing = {
  id: number;
  user_id: string;
  category: ListingCategory | null;
  listing_type: ListingType | null;
  state: string | null;
  city: string | null;
  municipality: string | null;
  street: string | null;
  street_number: number | null;
  surface_m2: number | null;
  rooms: number | null;
  orientation: ListingOrientation | null;
  // Per m² for a sale, per month for a rental. Filters always compare this.
  price_eur: number | null;
  // Sale listings only, optional. When missing, the total is worked out from
  // price_eur × surface_m2 — see utils/listingPrice.
  total_price_eur?: number | null;
  parking: ListingParking | null;
  construction_type: ListingConstructionType | null;
  property_condition: ListingPropertyCondition | null;
  storey: ListingStorey | null;
  storey_floor_number: number | null;
  heating_types: ListingHeating[] | null;
  ground_type: ListingGround | null;
  ground_other: string | null;
  furniture: ListingFurniture | null;
  nearby_objects: ListingNearbyObject[] | null;
  additional_features: ListingAdditionalFeature[] | null;
  description: string | null;
  media_mode: ListingMediaMode | null;
  tier?: PackageTier | null;
  priority_rank?: number | null;
  created_at?: string | null;
  expires_at?: string | null;
  media: ListingMedia[];
  video_url?: string | null;
  user: Profile;
  likeCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
};

export type ListingFilters = {
  category?: ListingCategory | null;
  listingType?: ListingType | null;
  state?: string;
  city?: string;
  municipality?: string;
  minSurfaceM2?: number | null;
  maxSurfaceM2?: number | null;
  minRooms?: number | null;
  maxRooms?: number | null;
  minPriceEur?: number | null;
  maxPriceEur?: number | null;
  // Alternatives, not requirements: choosing north and east means either will
  // do. A listing has exactly one of each, so these match with `.in()`.
  orientation?: ListingOrientation[];
  parking?: ListingParking[];
  constructionType?: ListingConstructionType[];
  propertyCondition?: ListingPropertyCondition[];
  storey?: ListingStorey[];
  // Only meaningful while `storey` includes "floor", the option that carries a
  // typed-in number. One number, not a range: a listing sits on exactly one
  // floor, and that is what this matches. Cleared when the storey is
  // deselected, so it cannot linger and narrow the feed invisibly.
  storeyFloorNumber?: number | null;
  // Matches a listing that has *any* of the selected heating types — a buyer
  // picking two is saying "either would do", not "must have both".
  heatingTypes?: ListingHeating[];
  groundType?: ListingGround[];
  furniture?: ListingFurniture[];
  nearbyObjects?: ListingNearbyObject[];
  // Matches a listing that has *all* of the selected features, the way nearby
  // objects work — these read as requirements rather than alternatives.
  additionalFeatures?: ListingAdditionalFeature[];
  searchText?: string;
};

/**
 * Which feed a saved search belongs to. The stored criteria cannot say on
 * their own — "Stan, Beograd, do 120.000 €" describes a place to find on one
 * feed and a person to find on the other.
 */
export const SAVED_SEARCH_KINDS = ["listings", "buyers"] as const;
export type SavedSearchKind = (typeof SAVED_SEARCH_KINDS)[number];

type SavedSearchBase = {
  id: string;
  userId: string;
  createdAt: string;
};

// A union rather than one widened `filters` type, so reading a saved search
// narrows to the right filter shape — the two are not interchangeable, and the
// buyers side carries `usernameQuery`, which means nothing to the listings feed.
export type SavedSearch = SavedSearchBase &
  (
    | { kind: "listings"; filters: ListingFilters }
    | { kind: "buyers"; filters: BuyerFilters }
  );

export type CreateListingInput = {
  user_id: string;
  category: ListingCategory;
  listing_type: ListingType;
  state: string;
  city: string;
  municipality: string;
  street: string;
  street_number: number | null;
  surface_m2: number;
  rooms?: number | null;
  orientation?: ListingOrientation | null;
  price_eur: number;
  total_price_eur?: number | null;
  parking?: ListingParking | null;
  construction_type?: ListingConstructionType | null;
  property_condition?: ListingPropertyCondition | null;
  storey?: ListingStorey | null;
  storey_floor_number?: number | null;
  heating_types?: ListingHeating[];
  ground_type?: ListingGround | null;
  ground_other?: string | null;
  furniture?: ListingFurniture | null;
  nearby_objects?: ListingNearbyObject[];
  additional_features?: ListingAdditionalFeature[];
  description?: string | null;
  media_mode: ListingMediaMode;
  // Optional: which credit tier to spend. Omit to let the DB trigger pick the
  // highest-priority tier the user currently holds credits for.
  tier?: PackageTier | null;
};

export type ListingCreditSummary = {
  byTier: Partial<Record<PackageTier, number>>;
  total: number;
};

export type PackagePurchase = {
  id: string;
  userId: string;
  tier: PackageTier;
  listingsGranted: number;
  durationDays: number;
  priceRsd: number;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
};

export type CreateListingMediaInput = {
  listing_id: number;
  kind: ListingMediaKind;
  storage_path: string;
  public_url: string;
  sort_order: number;
};

export type SelectedVideoAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type NewListingDraft = {
  category: ListingCategory;
  listingType: ListingType;
  state: string;
  city: string;
  municipality: string;
  street: string;
  streetNumber: string;
  surfaceM2: string;
  rooms: string;
  orientation: ListingOrientation | null;
  priceEur: string;
  totalPriceEur: string;
  parking: ListingParking | null;
  constructionType: ListingConstructionType | null;
  propertyCondition: ListingPropertyCondition | null;
  storey: ListingStorey | null;
  storeyFloorNumber: string;
  heatingTypes: ListingHeating[];
  groundType: ListingGround | null;
  groundOther: string;
  furniture: ListingFurniture | null;
  nearbyObjects: ListingNearbyObject[];
  additionalFeatures: ListingAdditionalFeature[];
  description: string;
  mediaMode: ListingMediaMode | null;
  photos: string[];
  video: SelectedVideoAsset | null;
};

// Which half of the app a person gets, captured during onboarding and
// changeable at any time in Edit profile. Lives on `profiles`, not on a
// preference set — a person is one or the other however many preference sets they
// keep.
//
// There used to be a third value, "both". Every screen that branched on it had
// to decide what it meant and every one of them answered "seller", so it was a
// value that cost a decision everywhere and bought nothing. Switching type
// destroys nothing: a seller's preference sets and a buyer's listings both stay in
// the database, just out of sight until they switch back.
export const ACCOUNT_TYPE_VALUES = ["buyer", "seller"] as const;
export type AccountType = (typeof ACCOUNT_TYPE_VALUES)[number];

// What a buyer is looking for. Mirrors `ListingFilters` field for field, minus
// `searchText` — a free-text term is something you type for one search, not
// something you keep. Keep the two in step: the point is that stating a
// preference and running a filter ask the same questions.
export type PreferenceCriteria = {
  // The buyer's own words for what they're after. Not a filter — nothing
  // matches against it — but it is what a seller reads first on their card.
  description?: string | null;
  category?: ListingCategory | null;
  listingType?: ListingType | null;
  state?: string | null;
  city?: string | null;
  municipality?: string | null;
  minSurfaceM2?: number | null;
  maxSurfaceM2?: number | null;
  minRooms?: number | null;
  maxRooms?: number | null;
  minPriceEur?: number | null;
  maxPriceEur?: number | null;
  orientation?: ListingOrientation[];
  parking?: ListingParking[];
  constructionType?: ListingConstructionType[];
  propertyCondition?: ListingPropertyCondition[];
  storey?: ListingStorey[];
  storeyFloorNumber?: number | null;
  heatingTypes?: ListingHeating[];
  groundType?: ListingGround[];
  furniture?: ListingFurniture[];
  nearbyObjects?: ListingNearbyObject[];
  additionalFeatures?: ListingAdditionalFeature[];
};

/**
 * One saved preference set: a full set of criteria plus where it sits among the
 * cards on the profile. A buyer keeps up to MAX_PREFERENCE_SETS of them.
 */
export type PreferenceSet = PreferenceCriteria & {
  id: string;
  position: number;
};

/** Enforced in the UI and again by a trigger — see the 02 migration. */
export const MAX_PREFERENCE_SETS = 5;

/**
 * One card in the Buyers feed. A buyer with three matching preference sets produces
 * three of these, each carrying the set that matched, so the chips on the card
 * always explain why that card surfaced for this search. `preferenceSetId` is
 * what makes them distinct — the profile repeats across them.
 */
export type BuyerProfile = Profile & {
  preferenceSetId: string;
  preferences: PreferenceCriteria;
};

// Narrows the Buyers feed by what the buyers are after. Every criterion here
// reads against the matching column on their `user_preferences` row, so this
// mirrors `PreferenceCriteria` — the range fields bracket the buyer's own range.
export type BuyerFilters = {
  category?: ListingCategory | null;
  listingType?: ListingType | null;
  state?: string;
  city?: string;
  municipality?: string;
  minSurfaceM2?: number | null;
  maxSurfaceM2?: number | null;
  minRooms?: number | null;
  maxRooms?: number | null;
  minPriceEur?: number | null;
  maxPriceEur?: number | null;
  // Against a buyer's own array columns these match with `.overlaps()`: one
  // shared value between what the seller asks for and what the buyer accepts
  // is enough.
  orientation?: ListingOrientation[];
  parking?: ListingParking[];
  constructionType?: ListingConstructionType[];
  propertyCondition?: ListingPropertyCondition[];
  storey?: ListingStorey[];
  storeyFloorNumber?: number | null;
  heatingTypes?: ListingHeating[];
  groundType?: ListingGround[];
  furniture?: ListingFurniture[];
  nearbyObjects?: ListingNearbyObject[];
  additionalFeatures?: ListingAdditionalFeature[];
  usernameQuery?: string;
  searchText?: string;
};

export type NotificationType = "like" | "save" | "message" | "offer";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string | null;
  actor: Profile | null;
  listingId: number | null;
  isRead: boolean;
  createdAt: string;
};


export type Conversation = {
  id: string;
  user1Id: string;
  user2Id: string;
  listingId: number | null;
  createdAt: string;
  lastMessageAt: string;
  otherUser: Profile;
  lastMessage?: string;
  unreadCount: number;
};

export type MessageListing = {
  id: number;
  displayText: string;
};

export type MessageAttachment = {
  id: string;
  messageId: string;
  url: string;
  mediaType: "image" | "video";
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  createdAt: string;
  isRead: boolean;
  listing?: MessageListing | null;
  attachments?: MessageAttachment[];
};
