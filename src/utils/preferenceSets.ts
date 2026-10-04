// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { ListingFilters, PreferenceCriteria } from "@/types/types";
import { getListingFilterChipLabels } from "@/utils/listingFilters";
import { formatAmount } from "@/utils/rangeLabels";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * A preference set holds the same criteria as a listing filter, so the two share one
 * chip builder. The only difference is the null: a set reads its empty fields
 * back from the database as null, where a filter simply omits them. The
 * description is the one thing a set has that a filter does not, so it stays
 * behind.
 */
const toListingFilters = ({
  description: _description,
  ...criteria
}: PreferenceCriteria): ListingFilters => ({
  ...criteria,
  category: criteria.category ?? null,
  listingType: criteria.listingType ?? null,
  state: criteria.state ?? undefined,
  city: criteria.city ?? undefined,
  municipality: criteria.municipality ?? undefined,
});

/**
 * What `hasStatedCriteria` does not count as having been stated.
 *
 * `state` is in here for the same reason it never becomes a chip: onboarding
 * fills the country in for everyone, so a set holding nothing else is a card
 * its owner started and left, not something they are looking for. The other
 * two are the row's own identity rather than a criterion.
 */
const UNSTATED_KEYS = new Set(["id", "position", "state"]);

/**
 * Whether a set says anything at all about what its owner is after.
 *
 * Read off the object rather than a list of fields, so a criterion added later
 * counts on its own. Used to keep the blank cards on somebody else's profile
 * out of sight: on your own they are yours to fill in, but to a seller reading
 * them they are noise with an instruction attached.
 *
 * The same rule the database keeps: `has_preferences`
 * (20261001_user_preferences_description.sql) counts the description and every
 * criterion but the country, and is what keeps these sets out of the Buyers
 * feed. Worth keeping the two in step — a buyer hidden from the feed should
 * not reappear on a profile.
 */
export const hasStatedCriteria = (criteria: PreferenceCriteria): boolean =>
  Object.entries(criteria).some(([key, value]) => {
    if (UNSTATED_KEYS.has(key)) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return value != null;
  });

/**
 * The heading on a preference card and the chips under it, built together so they
 * cannot repeat each other: whatever the title says is taken out of the chips.
 *
 * The title is generated rather than typed. Naming five of these by hand is
 * work nobody would do, and a summary stays true when the criteria change.
 * A set with nothing in it yet falls back to a numbered label so a card added
 * and not filled in still reads as something rather than as a blank.
 */
export const getPreferenceSummary = (
  criteria: PreferenceCriteria,
  index: number,
  t: TranslateFn,
) => {
  const titleParts: string[] = [];
  const rest = toListingFilters(criteria);

  if (criteria.category) {
    titleParts.push(t(`newListing.categories.${criteria.category}`));
    rest.category = null;
  } else if (criteria.listingType) {
    titleParts.push(t(`newListing.listingTypes.${criteria.listingType}`));
    rest.listingType = null;
  }

  // Most specific location wins — a city says more than the country, which
  // onboarding fills in for everyone by default. The country never becomes a
  // chip either, for the same reason: it would be on every card and narrow
  // nothing.
  rest.state = undefined;

  const locationKey = (["city", "municipality"] as const).find((key) =>
    criteria[key]?.trim(),
  );

  if (locationKey) {
    titleParts.push(criteria[locationKey]!.trim());
    rest[locationKey] = undefined;
  } else if (criteria.state?.trim()) {
    titleParts.push(criteria.state.trim());
  }

  const { minPriceEur, maxPriceEur } = criteria;

  if (minPriceEur != null && maxPriceEur != null) {
    titleParts.push(
      t("preferences.priceRange", {
        min: formatAmount(minPriceEur),
        max: formatAmount(maxPriceEur),
      }),
    );
  } else if (maxPriceEur != null) {
    titleParts.push(t("preferences.priceUpTo", { value: formatAmount(maxPriceEur) }));
  } else if (minPriceEur != null) {
    titleParts.push(t("preferences.priceFrom", { value: formatAmount(minPriceEur) }));
  }

  rest.minPriceEur = null;
  rest.maxPriceEur = null;

  return {
    title:
      titleParts.length > 0
        ? titleParts.join(" · ")
        : t("preferences.untitled", { index: index + 1 }),
    chips: getListingFilterChipLabels(rest, t),
  };
};
