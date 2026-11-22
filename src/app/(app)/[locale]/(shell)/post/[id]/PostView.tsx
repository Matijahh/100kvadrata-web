"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import ChatIcon from "@assets/icons/chat-icon.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { SponsoredTag, useMessageAuthor } from "@/components/feed/MarketingPostCards";
import { ListingMedia } from "@/components/listing/ListingMedia";
import { useRouter } from "@/i18n/navigation";
import type { MarketingPost } from "@/types/types";
import { useTranslation } from "react-i18next";

/**
 * A sponsored post's page, laid out like ListingView: media fills the left on
 * desktop and stays put while the text scrolls on the right; on a phone the
 * media sits on top. A post has no price, place or specs, so the right column
 * is the Sponsored tag, the author with a Message button, and the description.
 */
export function PostView({ post }: { post: MarketingPost }) {
  const { t } = useTranslation();
  const router = useRouter();
  const author = useMessageAuthor(post);
  const authorName = post.user?.username ?? t("admin.senderName");

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/feed");
    }
  };

  return (
    <div className="bg-surface md:mx-auto md:grid md:min-h-dvh md:max-w-page md:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] xl:grid-cols-[minmax(0,1fr)_520px]">
      <div className="relative md:sticky md:top-0 md:h-dvh">
        <ListingMedia
          listing={post}
          isActive
          priority
          className="aspect-[4/5] max-h-[72dvh] w-full md:aspect-auto md:h-full md:max-h-none"
        />
        <button
          type="button"
          onClick={goBack}
          aria-label={t("web.listing.back")}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
        >
          <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-7 overflow-x-clip px-5 pb-10 pt-6 md:px-8 md:pt-10">
        <SponsoredTag className="self-start shadow-none ring-1 ring-border" />

        <div className="flex items-center gap-3">
          <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-full">
            <Avatar userId={post.user_id} avatarUrl={post.user?.avatarUrl} />
          </span>
          <span className="min-w-0 flex-1 truncate text-[17px] font-semibold text-text">{authorName}</span>
          {!author.isOwnPost ? (
            <button
              type="button"
              onClick={author.message}
              disabled={author.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 font-display text-sm uppercase text-text-on-primary disabled:opacity-60"
            >
              <ChatIcon width={16} height={16} aria-hidden />
              {t("admin.message")}
            </button>
          ) : null}
        </div>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[1.2px] text-text-muted">
            {t("listing.detailsDescription")}
          </h2>
          <p className="whitespace-pre-line break-words text-[17px] leading-[26px] text-text">
            {post.description}
          </p>
        </section>
      </div>
    </div>
  );
}
