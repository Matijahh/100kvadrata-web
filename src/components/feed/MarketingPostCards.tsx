"use client";

import ChatIcon from "@assets/icons/chat-icon.svg";
import ChevronUpIcon from "@assets/icons/chevron-up-icon.svg";
import PlayFilledIcon from "@assets/icons/play-icon-filled.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { ListingMedia } from "@/components/listing/ListingMedia";
import { Modal } from "@/components/ui/Modal";
import { useDirectMessage } from "@/hooks/useDirectMessage";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/useAuthStore";
import type { MarketingPost } from "@/types/types";
import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Admin marketing posts in the listings feed (FEAT-42): a reel card and a grid
// tile that look like their listing counterparts, with a Sponsored tag and no
// price, place or details. Messaging opens a chat with the admin who posted.

export function SponsoredTag({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-surface px-3 py-1 font-display text-xs uppercase tracking-[0.6px] text-primary shadow-[0_2px_10px_rgba(0,0,0,0.15)]",
        className,
      )}
    >
      {t("admin.sponsored")}
    </span>
  );
}

// Roughly what fits in the three lines shown on the card; past that (or with
// line breaks) the post gets a Details button, like a listing.
const SHORT_DESCRIPTION_CHARS = 110;
const isLongDescription = (description: string) =>
  description.length > SHORT_DESCRIPTION_CHARS || description.split("\n").length > 3;

export const useMessageAuthor = (post: MarketingPost) => {
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const { openDirectMessage, pendingUserId } = useDirectMessage();
  return {
    isOwnPost: sessionUser?.id === post.user_id,
    isPending: pendingUserId === post.user_id,
    message: () => void openDirectMessage(post.user_id),
  };
};

/** One post in the phone / tablet reel, sized like ReelCard. */
export function MarketingReelCard({
  post,
  isActive,
  isNear,
}: {
  post: MarketingPost;
  isActive: boolean;
  isNear: boolean;
}) {
  const { t } = useTranslation();
  const author = useMessageAuthor(post);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const authorName = post.user?.username ?? t("admin.senderName");
  const hasDetails = isLongDescription(post.description);

  return (
    <div className="flex h-full w-full items-stretch justify-center md:px-6 md:py-5">
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-black",
          "md:aspect-[9/16] md:w-auto md:max-w-full md:rounded-[32px] md:shadow-[0_12px_40px_rgba(0,0,0,0.18)]",
        )}
      >
        {isNear ? (
          <>
            <ListingMedia
              listing={post}
              isActive={isActive}
              autoPlay
              priority={isActive}
              sizes="(min-width: 768px) 480px, 100vw"
              dotsPosition="top"
              minimalVideo
              className="h-full w-full bg-black"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0">
              <div className="flex items-end gap-3 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-28 md:px-5 md:pb-6">
                <div className="min-w-0 flex-1 text-white">
                  <SponsoredTag className="mb-3" />
                  <p className="line-clamp-3 text-[15px] leading-[21px]">{post.description}</p>
                  <button
                    type="button"
                    onClick={author.message}
                    disabled={author.isOwnPost || author.isPending}
                    className="pointer-events-auto mt-3 inline-flex max-w-full items-center gap-2 rounded-full py-1 pr-3 hover:bg-white/10 disabled:hover:bg-transparent"
                  >
                    <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white">
                      <Avatar userId={post.user_id} avatarUrl={post.user?.avatarUrl} />
                    </span>
                    <span className="truncate text-[15px] font-semibold">{authorName}</span>
                  </button>
                </div>
                <div className="pointer-events-auto flex flex-col items-center gap-3.5">
                  {!author.isOwnPost ? (
                    <button
                      type="button"
                      onClick={author.message}
                      disabled={author.isPending}
                      aria-label={t("admin.message")}
                      className="flex flex-col items-center gap-1 text-white disabled:opacity-60"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm transition-colors hover:bg-black/50">
                        <ChatIcon width={24} height={24} aria-hidden />
                      </span>
                    </button>
                  ) : null}
                  {/* Same Details button and sheet as a listing in the reel. */}
                  {hasDetails ? (
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(true)}
                      aria-label={t("web.feed.details")}
                      className="flex flex-col items-center gap-1 text-white"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm transition-colors hover:bg-black/50">
                        <ChevronUpIcon width={24} height={24} aria-hidden />
                      </span>
                      <span className="text-xs font-semibold [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
                        {t("web.feed.details")}
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <Modal open={isDetailsOpen} onOpenChange={setDetailsOpen} title={t("web.feed.details")} hideTitle>
        <PostDetails post={post} />
      </Modal>
    </div>
  );
}

/** The details sheet's content: who posted it and the whole description. */
function PostDetails({ post }: { post: MarketingPost }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5 pt-2">
      <SponsoredTag className="self-start shadow-none ring-1 ring-border" />
      <section className="flex flex-col gap-2.5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[1.2px] text-text-muted">
          {t("listing.detailsDescription")}
        </h3>
        <p className="whitespace-pre-line text-[17px] leading-[26px] text-text">{post.description}</p>
      </section>
    </div>
  );
}

/**
 * One post in the desktop grid, shaped like ListingCard. Clicking opens the
 * post's own page (/post/:id), like a listing opens /listing/:id.
 */
export function MarketingGridCard({ post }: { post: MarketingPost }) {
  const { t } = useTranslation();
  const photo = post.media.find((item) => item.kind === "photo");
  const authorName = post.user?.username ?? t("admin.senderName");

  return (
    <>
      <Link
        href={`/post/${post.id}`}
        className="group flex flex-col overflow-hidden rounded-3xl bg-surface text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-media-placeholder">
          {photo ? (
            <Image
              src={photo.public_url}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-media-placeholder-text">
              <PlayFilledIcon width={34} height={34} aria-hidden />
            </span>
          )}
          <SponsoredTag className="absolute left-2.5 top-2.5" />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3.5">
          <p className="line-clamp-2 text-[14px] text-text">{post.description}</p>
          <p className="truncate text-[13px] text-text-muted">{authorName}</p>
        </div>
      </Link>
    </>
  );
}
