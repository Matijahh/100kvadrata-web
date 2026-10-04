// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { PACKAGES_ENABLED } from "@/constants/featureFlags";
import { PackageTier } from "@/types/types";

export type PackageDefinition = {
  tier: PackageTier;
  listings: number;
  durationDays: number;
  priceRsd: number;
  premiumBadge: boolean;
  priorityRank: number;
  canSearchBuyers: boolean;
};

export const PACKAGE_TIERS: PackageTier[] = [
  "standard",
  "premium",
  "exclusive",
  "exclusive_plus",
];

// Mirrors the server-side definitions in
// supabase/migrations/20260521_packages_03_functions.sql. The DB independently
// enforces these numbers; the UI reads them from here.
export const PACKAGES: Record<PackageTier, PackageDefinition> = {
  standard: {
    tier: "standard",
    listings: 3,
    durationDays: 15,
    priceRsd: 1450,
    premiumBadge: false,
    priorityRank: 0,
    canSearchBuyers: false,
  },
  premium: {
    tier: "premium",
    listings: 4,
    durationDays: 15,
    priceRsd: 1750,
    premiumBadge: true,
    priorityRank: 1,
    canSearchBuyers: false,
  },
  exclusive: {
    tier: "exclusive",
    listings: 4,
    durationDays: 30,
    priceRsd: 2050,
    premiumBadge: true,
    priorityRank: 2,
    canSearchBuyers: false,
  },
  exclusive_plus: {
    tier: "exclusive_plus",
    listings: 6,
    durationDays: 30,
    priceRsd: 2550,
    premiumBadge: true,
    priorityRank: 3,
    canSearchBuyers: true,
  },
};

export const isPremiumTier = (tier?: PackageTier | null): boolean => {
  // Nothing sells tiers yet, so no listing has one that could earn the badge.
  // Until the packages flow ships every listing carries it; turning
  // PACKAGES_ENABLED back on hands the decision to the tier again, with no
  // data to migrate because this only ever affected what is drawn.
  if (!PACKAGES_ENABLED) {
    return true;
  }

  return tier != null && PACKAGES[tier]?.premiumBadge === true;
};

// Serbian-style thousands grouping: 1450 -> "1.450", 2550 -> "2.550".
export const formatRsd = (value: number): string =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
