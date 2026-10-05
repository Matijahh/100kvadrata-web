"use client";

import NoMessagesIllustration from "@assets/illustrations/no-messages.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { formatRelativeTime } from "@/lib/relativeTime";
import { fetchConversations } from "@/services/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// The web has no push, so the open inbox re-checks while the tab is visible.
// Not faster: fetchConversations reads every conversation's messages to find
// the last one, so each refresh costs bandwidth.
const INBOX_REFRESH_MS = 30_000;

/** The inbox — web port of the app's InboxScreen rows. */
export function ConversationList({ activeConversationId }: { activeConversationId?: string }) {
  const { t } = useTranslation();
  const sessionUser = useAuthStore((state) => state.sessionUser);

  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversations(sessionUser?.id ?? ""),
    queryFn: () => fetchConversations(sessionUser!.id),
    enabled: !!sessionUser,
    refetchInterval: INBOX_REFRESH_MS,
    refetchOnMount: "always",
  });
  const conversations = conversationsQuery.data ?? [];

  if (conversationsQuery.isLoading) {
    return <Spinner className="py-20" />;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        {/* Full screen on phones; a 340px column on desktop — never wider than it. */}
        <NoMessagesIllustration className="h-auto w-[min(100%,200px)] md:w-[min(100%,260px)]" aria-hidden />
        <p className="max-w-xs text-[15px] font-semibold text-text-muted">{t("inbox.emptyState")}</p>
      </div>
    );
  }

  return (
    <ul className="py-2">
      {conversations.map((conversation) => {
        const isActive = conversation.id === activeConversationId;
        const isUnread = conversation.unreadCount > 0;
        return (
          <li key={conversation.id}>
            <Link
              href={`/chat/${conversation.id}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3.5 px-5 py-3 transition-colors",
                isActive ? "bg-primary/10" : "hover:bg-surface-muted",
              )}
            >
              <span className="relative shrink-0">
                <span className="block h-[50px] w-[50px] overflow-hidden rounded-full bg-surface-muted">
                  <Avatar userId={conversation.otherUser.id} avatarUrl={conversation.otherUser.avatarUrl} />
                </span>
                {isUnread ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D94B4B] px-1 text-[10px] font-semibold text-white">
                    {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                  </span>
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-text">{conversation.otherUser.username}</span>
                  <span className="shrink-0 text-xs text-text-muted">
                    {formatRelativeTime(conversation.lastMessageAt)}
                  </span>
                </span>
                {conversation.lastMessage ? (
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-sm",
                      isUnread ? "font-semibold text-text" : "text-text-muted",
                    )}
                  >
                    {conversation.lastMessage}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
