"use client";

import { recordListingView } from "@/services/listings";
import { useAuthStore } from "@/stores/useAuthStore";
import { Listing } from "@/types/types";
import { getViewerKey } from "@/utils/viewerKey";
import { useEffect } from "react";

// Platform adapter — same rules as flatswipe/src/hooks/useListingViewTracker.ts:
// a view counts after the listing has been on screen for two seconds, at most
// once per listing per 30 minutes from this browser, never for the owner. The
// RPC applies the real rules again server-side. "App in the foreground" becomes
// "tab visible" here.

const VIEW_DWELL_MS = 2000;
const VIEW_SESSION_WINDOW_MS = 30 * 60 * 1000;

const lastCountedAt = new Map<number, number>();

export const useListingViewTracker = (listing: Listing, isActive: boolean) => {
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const listingId = listing.id;
  const isOwnListing = !!sessionUser && sessionUser.id === listing.user_id;

  useEffect(() => {
    if (!isActive || isOwnListing) {
      return;
    }

    const lastCounted = lastCountedAt.get(listingId);

    if (lastCounted != null && Date.now() - lastCounted < VIEW_SESSION_WINDOW_MS) {
      return;
    }

    const dwellTimer = setTimeout(async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const viewerKey = await getViewerKey();

      if (!viewerKey) {
        return;
      }

      lastCountedAt.set(listingId, Date.now());
      void recordListingView(listingId, viewerKey);
    }, VIEW_DWELL_MS);

    return () => clearTimeout(dwellTimer);
  }, [isActive, isOwnListing, listingId]);
};
