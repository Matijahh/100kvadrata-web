"use client";

import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { buildListingUrl } from "@/lib/shareListing";
import { findOrCreateConversation } from "@/services/chat";
import {
  fetchLikedListingIds,
  fetchSavedListingIds,
  likeListing,
  saveListing,
  unlikeListing,
  unsaveListing,
} from "@/services/listings";
import { ReportReason, reportListing } from "@/services/reports";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSignInPromptStore } from "@/stores/useSignInPromptStore";
import type { Listing } from "@/types/types";
import { promptDestructiveChoice } from "@/utils/confirmAction";
import { getListingPriceLabel } from "@/utils/listingPrice";
import { type InfiniteData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Everything a viewer can do to a listing — like, save, message the owner,
 * share, report — with the same optimistic updates and sign-in prompts as the
 * app's listing screen and feed. One hook so the listing page, the reel and
 * the grid all behave identically.
 */
export function useListingActions(listing: Listing) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const promptSignIn = useSignInPromptStore((state) => state.promptSignIn);
  const [isChatPending, setChatPending] = useState(false);
  const listingId = listing.id;
  const listingKey = queryKeys.listing(listingId.toString());

  const savedIdsQuery = useQuery({
    queryKey: sessionUser ? queryKeys.savedListingIds(sessionUser.id) : ["savedListingIds", "guest"],
    queryFn: () => fetchSavedListingIds(sessionUser!.id),
    enabled: !!sessionUser,
  });

  const likedIdsQuery = useQuery({
    queryKey: sessionUser ? queryKeys.likedListingIds(sessionUser.id) : ["likedListingIds", "guest"],
    queryFn: () => fetchLikedListingIds(sessionUser!.id),
    enabled: !!sessionUser,
  });

  const isSaved = (savedIdsQuery.data ?? []).includes(listingId);
  const isLiked = (likedIdsQuery.data ?? []).includes(listingId);
  const isOwnListing = !!sessionUser && sessionUser.id === listing.user_id;

  const likeMutation = useMutation({
    mutationFn: async (isCurrentlyLiked: boolean) => {
      if (!sessionUser) return;
      if (isCurrentlyLiked) {
        await unlikeListing(sessionUser.id, listingId);
      } else {
        await likeListing(sessionUser.id, listingId);
      }
    },
    onMutate: async (isCurrentlyLiked) => {
      if (!sessionUser) return undefined;
      const idsKey = queryKeys.likedListingIds(sessionUser.id);
      await queryClient.cancelQueries({ queryKey: idsKey });
      await queryClient.cancelQueries({ queryKey: listingKey });

      const previousIds = queryClient.getQueryData<number[]>(idsKey) ?? [];
      const previousListing = queryClient.getQueryData<Listing>(listingKey);

      queryClient.setQueryData(
        idsKey,
        isCurrentlyLiked
          ? previousIds.filter((id) => id !== listingId)
          : [...previousIds, listingId],
      );
      const bumpLikes = (item: Listing) =>
        item.id === listingId
          ? { ...item, likeCount: Math.max(0, (item.likeCount ?? 0) + (isCurrentlyLiked ? -1 : 1)) }
          : item;

      queryClient.setQueryData<Listing>(listingKey, (current) => (current ? bumpLikes(current) : current));

      // The feed's pages carry their own copy of the count.
      await queryClient.cancelQueries({ queryKey: queryKeys.listings });
      const previousFeeds = queryClient.getQueriesData<InfiniteData<Listing[]>>({ queryKey: queryKeys.listings });
      queryClient.setQueriesData<InfiniteData<Listing[]>>({ queryKey: queryKeys.listings }, (current) =>
        current?.pages
          ? { ...current, pages: current.pages.map((page) => page.map(bumpLikes)) }
          : current,
      );

      return { previousIds, previousListing, previousFeeds };
    },
    onError: (_error, _vars, context) => {
      if (!sessionUser || !context) return;
      queryClient.setQueryData(queryKeys.likedListingIds(sessionUser.id), context.previousIds);
      queryClient.setQueryData(listingKey, context.previousListing);
      context.previousFeeds.forEach(([key, data]) => queryClient.setQueryData(key, data));
      showToast({
        type: "error",
        title: t("feed.likeFailedTitle"),
        message: t("feed.likeFailedMessage"),
      });
    },
    onSettled: () => {
      if (!sessionUser) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.likedListingIds(sessionUser.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings });
      queryClient.invalidateQueries({ queryKey: listingKey });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (isCurrentlySaved: boolean) => {
      if (!sessionUser) return;
      if (isCurrentlySaved) {
        await unsaveListing(sessionUser.id, listingId);
      } else {
        await saveListing(sessionUser.id, listingId);
      }
    },
    onMutate: async (isCurrentlySaved) => {
      if (!sessionUser) return undefined;
      const idsKey = queryKeys.savedListingIds(sessionUser.id);
      const listKey = queryKeys.savedListings(sessionUser.id);
      await queryClient.cancelQueries({ queryKey: idsKey });
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousIds = queryClient.getQueryData<number[]>(idsKey) ?? [];
      const previousSaved = queryClient.getQueryData<Listing[]>(listKey);

      queryClient.setQueryData(
        idsKey,
        isCurrentlySaved
          ? previousIds.filter((id) => id !== listingId)
          : [...previousIds, listingId],
      );
      if (previousSaved) {
        queryClient.setQueryData(
          listKey,
          isCurrentlySaved
            ? previousSaved.filter((item) => item.id !== listingId)
            : [{ ...listing, isSaved: true }, ...previousSaved],
        );
      }

      return { previousIds, previousSaved };
    },
    onError: (_error, _vars, context) => {
      if (!sessionUser || !context) return;
      queryClient.setQueryData(queryKeys.savedListingIds(sessionUser.id), context.previousIds);
      queryClient.setQueryData(queryKeys.savedListings(sessionUser.id), context.previousSaved);
      showToast({
        type: "error",
        title: t("feed.saveFailedTitle"),
        message: t("feed.saveFailedMessage"),
      });
    },
    onSettled: () => {
      if (!sessionUser) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.savedListingIds(sessionUser.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.savedListings(sessionUser.id) });
    },
  });

  const toggleLike = () => {
    if (!sessionUser) {
      promptSignIn("like");
      return;
    }
    if (!likeMutation.isPending) likeMutation.mutate(isLiked);
  };

  const toggleSave = () => {
    if (!sessionUser) {
      promptSignIn("save");
      return;
    }
    if (!saveMutation.isPending) saveMutation.mutate(isSaved);
  };

  const openChat = async () => {
    if (isChatPending) return;

    if (!sessionUser) {
      promptSignIn("message");
      return;
    }

    setChatPending(true);
    try {
      const conversation = await findOrCreateConversation(
        sessionUser.id,
        listing.user_id,
        listing.id,
      );
      const address = [listing.city, listing.street].filter(Boolean).join(", ");
      const price = getListingPriceLabel(listing, t);
      const listingRef = [address, price].filter(Boolean).join(" - ");
      const params = new URLSearchParams(
        listingRef ? { listingRef, listingId: String(listing.id) } : {},
      ).toString();
      router.push(`/chat/${conversation.id}${params ? `?${params}` : ""}`);
    } catch (error) {
      console.error("Opening chat failed", error);
      showToast({ type: "error", message: t("web.listing.chatFailed") });
    } finally {
      setChatPending(false);
    }
  };

  // The phone share sheet where there is one (mobile browsers); copying the
  // link everywhere else, which is what a desktop user expects.
  const share = async () => {
    const url = buildListingUrl(listing.id);

    if (typeof navigator.share === "function" && navigator.maxTouchPoints > 0) {
      try {
        await navigator.share({ title: t("listing.shareTitle"), url });
      } catch (error) {
        // Dismissing the share sheet rejects with AbortError — not a failure.
        if ((error as Error)?.name !== "AbortError") {
          showToast({
            type: "error",
            title: t("listing.shareErrorTitle"),
            message: t("listing.shareErrorMessage"),
          });
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast({ type: "success", message: t("web.listing.linkCopied") });
    } catch {
      showToast({
        type: "error",
        title: t("listing.shareErrorTitle"),
        message: t("listing.shareErrorMessage"),
      });
    }
  };

  const submitReport = async (reason: ReportReason) => {
    if (!sessionUser) return;

    try {
      await reportListing(sessionUser.id, listing.id, reason);
      showToast({
        type: "success",
        title: t("report.submittedTitle"),
        message: t("report.submittedMessage"),
      });
    } catch {
      showToast({ type: "error", message: t("report.submitFailed") });
    }
  };

  const report = () => {
    if (!sessionUser) {
      promptSignIn("report");
      return;
    }

    promptDestructiveChoice({
      title: t("report.listingTitle"),
      message: t("report.reasonPrompt"),
      options: [
        { label: t("report.reasonSpam"), onPress: () => submitReport("spam") },
        { label: t("report.reasonInappropriate"), onPress: () => submitReport("inappropriate") },
      ],
    });
  };

  return {
    isLiked,
    isSaved,
    isOwnListing,
    isSignedIn: !!sessionUser,
    isLikePending: likeMutation.isPending,
    isSavePending: saveMutation.isPending,
    isChatPending,
    toggleLike,
    toggleSave,
    openChat,
    share,
    report,
  };
}
