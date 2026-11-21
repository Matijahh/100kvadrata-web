"use client";

import HideIcon from "@assets/icons/hide-icon.svg";
import ImageIcon from "@assets/icons/image-icon.svg";
import PlayFilledIcon from "@assets/icons/play-icon-filled.svg";
import ShowIcon from "@assets/icons/show-icon.svg";
import TrashIcon from "@assets/icons/trash-icon.svg";
import { buttonClasses } from "@/components/genericComponents/Button";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import {
  deleteMarketingPost,
  fetchOwnMarketingPosts,
  setMarketingPostActive,
} from "@/services/marketingPosts";
import type { MarketingPost } from "@/types/types";
import { confirmDestructiveAction } from "@/utils/confirmAction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/**
 * The admin's own section on their profile (FEAT-42): every marketing post
 * they have published, with hide / show and delete. ("Send notification" is
 * in the settings drawer.) Web counterpart of the app's admin Posts tab.
 */
export function AdminPostsSection({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: queryKeys.ownMarketingPosts(userId),
    queryFn: () => fetchOwnMarketingPosts(userId),
    enabled: !!userId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["marketingPosts"] });
  const onError = () => showToast({ type: "error", message: t("admin.postUpdateError") });

  const toggleMutation = useMutation({
    mutationFn: (post: MarketingPost) => setMarketingPostActive(post.id, !post.is_active),
    onSettled: invalidate,
    onError,
  });
  const deleteMutation = useMutation({
    mutationFn: (post: MarketingPost) => deleteMarketingPost(post),
    onSettled: invalidate,
    onError,
  });

  const busyId =
    (toggleMutation.isPending ? toggleMutation.variables?.id : undefined) ??
    (deleteMutation.isPending ? deleteMutation.variables?.id : undefined);

  const confirmDelete = (post: MarketingPost) =>
    confirmDestructiveAction({
      title: t("admin.deletePostTitle"),
      message: t("admin.deletePostMessage"),
      confirmLabel: t("admin.deletePost"),
      onConfirm: () => deleteMutation.mutate(post),
    });

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(i18n.language === "en" ? "en-GB" : "sr-Latn-RS");

  const posts = postsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      {postsQuery.isLoading ? (
        <Spinner />
      ) : postsQuery.isError ? (
        <EmptyState title={t("admin.postsLoadError")} />
      ) : posts.length === 0 ? (
        <EmptyState icon={ImageIcon} title={t("admin.postsEmpty")}>
          <Link href="/new-post" className={buttonClasses()}>
            {t("admin.newPostTitle")}
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {posts.map((post) => {
            const firstPhoto = post.media.find((item) => item.kind === "photo");
            const isBusy = busyId === post.id;
            return (
              <li
                key={post.id}
                className={cn(
                  "flex items-center gap-3 rounded-3xl bg-surface p-3",
                  !post.is_active && "opacity-60",
                )}
              >
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-media-placeholder text-media-placeholder-text">
                  {firstPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={firstPhoto.public_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  {post.media_mode === "video" ? <PlayFilledIcon width={22} height={22} aria-hidden /> : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="line-clamp-2 text-sm text-text">{post.description}</span>
                  <span className="flex items-center gap-2 text-xs text-text-muted">
                    {formatDate(post.created_at)}
                    {!post.is_active ? (
                      <span className="rounded-full border border-border px-2 py-0.5 font-semibold">
                        {t("admin.hiddenBadge")}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(post)}
                    disabled={isBusy}
                    aria-label={post.is_active ? t("admin.hidePost") : t("admin.showPost")}
                    title={post.is_active ? t("admin.hidePost") : t("admin.showPost")}
                    className="rounded-full p-2 text-text hover:bg-surface-muted disabled:opacity-50"
                  >
                    {post.is_active ? (
                      <HideIcon width={20} height={20} aria-hidden />
                    ) : (
                      <ShowIcon width={20} height={20} aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(post)}
                    disabled={isBusy}
                    aria-label={t("admin.deletePost")}
                    title={t("admin.deletePost")}
                    className="rounded-full p-2 text-primary hover:bg-surface-muted disabled:opacity-50"
                  >
                    <TrashIcon width={20} height={20} aria-hidden />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
