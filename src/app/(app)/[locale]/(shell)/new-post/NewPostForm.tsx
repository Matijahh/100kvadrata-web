"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import Button from "@/components/genericComponents/Button";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { ListingMediaStep } from "@/components/newListing/ListingMediaStep";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "@/i18n/navigation";
import {
  createMarketingPost,
  MARKETING_POST_ERRORS,
  MARKETING_POST_MAX_VIDEO_BYTES,
} from "@/services/marketingPosts";
import type { NewListingDraft } from "@/types/types";
import { containsObjectionableContent } from "@/utils/contentFilter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

type PostMedia = Pick<NewListingDraft, "mediaMode" | "photos" | "video">;

const EMPTY_MEDIA: PostMedia = { mediaMode: null, photos: [], video: null };
const DESCRIPTION_MAX = 2000;

/**
 * Admin-only (FEAT-42): the web's New post page. A description plus photos or
 * one video, mixed into the listings feed. Reuses the listing media step; the
 * shared service optimises and uploads on Publish. The database refuses the
 * insert for anyone who isn't an admin.
 */
export function NewPostForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const descriptionId = useId();
  const { currentUser, isLoadingProfile } = useCurrentUser();
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<PostMedia>(EMPTY_MEDIA);

  const isAdmin = currentUser?.isAdmin === true;

  useEffect(() => {
    if (!isLoadingProfile && currentUser && !isAdmin) router.replace("/feed");
  }, [currentUser, isAdmin, isLoadingProfile, router]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error(t("newListing.loginRequired"));

      const trimmed = description.trim();
      if (!trimmed) throw new Error(t("admin.postDescriptionRequired"));
      if (containsObjectionableContent(trimmed)) throw new Error(t("moderation.blockedContent"));

      if (media.mediaMode === "photos" && media.photos.length > 0) {
        return createMarketingPost({
          userId: currentUser.id,
          description: trimmed,
          mediaMode: "photos",
          photoUris: media.photos,
        });
      }
      if (media.mediaMode === "video" && media.video) {
        return createMarketingPost({
          userId: currentUser.id,
          description: trimmed,
          mediaMode: "video",
          videoUri: media.video.uri,
        });
      }
      throw new Error(t("admin.postMediaRequired"));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["marketingPosts"] });
      showToast({ type: "success", message: t("admin.postPublished") });
      router.push("/profile?section=adminPosts");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "";
      showToast({
        type: "error",
        message:
          message === MARKETING_POST_ERRORS.videoTooLarge
            ? t("newListing.videoTooLarge", {
                limitMb: Math.round(MARKETING_POST_MAX_VIDEO_BYTES / (1024 * 1024)),
              })
            : !message
              ? t("admin.postPublishError")
              : message.startsWith(MARKETING_POST_ERRORS.uploadFailed)
                ? `${t("admin.postPublishError")} (${message.slice(MARKETING_POST_ERRORS.uploadFailed.length + 2)})`
                : message,
      });
    },
  });

  if (isLoadingProfile || !isAdmin) return <Spinner className="py-24" />;

  const hasMedia =
    (media.mediaMode === "photos" && media.photos.length > 0) ||
    (media.mediaMode === "video" && !!media.video);
  const isPublishing = publishMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10">
      <h1 className="mb-6 font-display text-3xl text-text">{t("admin.newPostTitle")}</h1>

      <div className="rounded-[32px] bg-surface p-5 md:p-8">
        <label htmlFor={descriptionId} className="mb-1.5 block text-sm font-light text-form-label">
          {t("admin.postDescriptionLabel")}
        </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("admin.postDescriptionPlaceholder")}
          maxLength={DESCRIPTION_MAX}
          rows={5}
          disabled={isPublishing}
          className="min-h-[130px] w-full resize-y rounded-[20px] bg-surface-muted px-[15px] py-3.5 text-base leading-[22px] text-text placeholder:text-placeholder focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
        />
        <p className="mb-6 mt-1.5 text-right text-xs font-light text-text-muted">
          {description.length}/{DESCRIPTION_MAX}
        </p>

        <h2 className="mb-4 font-display text-lg text-text">{t("admin.postPhotosOrVideo")}</h2>
        <ListingMediaStep draft={media} onChange={setMedia} />
      </div>

      <div className="fixed inset-x-0 bottom-[76px] z-30 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-page items-center justify-end gap-3">
          <Button
            title={isPublishing ? t("admin.publishingPost") : t("admin.publishPost")}
            onClick={() => publishMutation.mutate()}
            disabled={isPublishing || !description.trim() || !hasMedia}
            iconSvg={AnchorRightIcon}
            iconAlignment="right"
          />
        </div>
      </div>
    </div>
  );
}
