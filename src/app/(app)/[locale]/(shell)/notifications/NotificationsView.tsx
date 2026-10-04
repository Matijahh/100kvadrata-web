"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import MailOpenIcon from "@assets/icons/mail-open-icon.svg";
import NoNotificationsIllustration from "@assets/illustrations/no-notifications.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { formatRelativeTime } from "@/lib/relativeTime";
import { findOrCreateConversation } from "@/services/chat";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notifications";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Notification } from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/**
 * Likes, saves, messages and offers — web port of the app's notifications
 * screen. The web has no push (yet), so this page and the bell's badge are
 * where they surface.
 */
export function NotificationsView() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const userId = sessionUser?.id ?? "";

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => fetchNotifications(userId),
    enabled: !!sessionUser,
    refetchOnMount: "always",
    refetchInterval: 60_000,
  });
  const notifications = notificationsQuery.data ?? [];
  const hasUnread = notifications.some((notification) => !notification.isRead);

  // Read state flips straight away; the list refetches behind it.
  const setRead = (predicate: (notification: Notification) => boolean) =>
    queryClient.setQueryData<Notification[]>(queryKeys.notifications(userId), (current) =>
      current?.map((notification) => (predicate(notification) ? { ...notification, isRead: true } : notification)),
    );

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onMutate: (notificationId) => setRead((notification) => notification.id === notificationId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onMutate: () => setRead(() => true),
    onError: () => showToast({ type: "error", message: t("notifications.loadError") }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) }),
  });

  const handleOpen = async (notification: Notification) => {
    if (!notification.isRead) markReadMutation.mutate(notification.id);

    if (notification.type === "message" && notification.actorId && sessionUser) {
      try {
        const conversation = await findOrCreateConversation(sessionUser.id, notification.actorId);
        router.push(`/chat/${conversation.id}`);
      } catch {
        // Nothing to open; the notification is still marked read.
      }
      return;
    }

    if (notification.listingId != null) router.push(`/listing/${notification.listingId}`);
  };

  const actionText = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return t("notifications.likeText");
      case "message":
        return t("notifications.messageText");
      case "offer":
        return t("notifications.offerText");
      case "save":
      default:
        return t("notifications.saveText");
    }
  };

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/profile");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4 md:px-8 md:pt-8">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("web.listing.back")}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text hover:bg-surface"
        >
          <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
        </button>
        <h1 className="flex-1 font-display text-2xl text-text">{t("notifications.title")}</h1>
        {hasUnread ? (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-primary hover:bg-surface disabled:opacity-60"
          >
            <MailOpenIcon width={18} height={18} aria-hidden />
            {t("notifications.markAllRead")}
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[32px] bg-surface">
        {notificationsQuery.isLoading ? (
          <Spinner className="py-20" />
        ) : notificationsQuery.isError ? (
          <EmptyState title={t("notifications.loadError")} />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <NoNotificationsIllustration width={200} height={200} aria-hidden />
            <p className="text-[15px] font-semibold text-text-muted">{t("notifications.emptyState")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-divider">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => void handleOpen(notification)}
                  className={cn(
                    "flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-surface-muted",
                    !notification.isRead && "bg-primary/5",
                  )}
                >
                  <span className="relative shrink-0">
                    <span className="block h-[50px] w-[50px] overflow-hidden rounded-full bg-surface-muted">
                      <Avatar userId={notification.actor?.id} avatarUrl={notification.actor?.avatarUrl} />
                    </span>
                    {!notification.isRead ? (
                      <span
                        className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-surface bg-primary"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[15px] text-text">
                      <span className="font-semibold">
                        {notification.actor?.username ?? t("notifications.unknownActor")}
                      </span>{" "}
                      {actionText(notification.type)}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
