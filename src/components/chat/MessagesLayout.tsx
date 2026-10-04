"use client";

import { ConversationList } from "@/components/chat/ConversationList";
import { cn } from "@/lib/cn";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";

/**
 * Inbox and chat share one screen on desktop — the conversation list on the
 * left, the open chat on the right — the way desktop messengers work. On
 * phones it is the app's two screens: the list at /inbox, the chat full
 * screen at /chat/:id. A layout, so the list stays mounted (and keeps its
 * scroll) while moving between conversations.
 */
export function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const params = useParams<{ conversationId?: string }>();
  const activeConversationId = params?.conversationId;
  const isChatOpen = !!activeConversationId;

  return (
    <div className={cn("flex md:h-dvh", isChatOpen ? "h-dvh" : "min-h-[calc(100dvh-92px)]")}>
      <aside
        className={cn(
          "w-full shrink-0 flex-col bg-surface md:flex md:w-[340px] md:border-r md:border-border",
          isChatOpen ? "hidden" : "flex",
        )}
      >
        <h1 className="px-5 pb-2 pt-6 text-center font-display text-lg uppercase text-text md:text-left md:text-xl md:normal-case">
          {t("inbox.title")}
        </h1>
        <div className="min-h-0 flex-1 md:overflow-y-auto">
          <ConversationList activeConversationId={activeConversationId} />
        </div>
      </aside>
      <section className={cn("min-w-0 flex-1 flex-col", isChatOpen ? "flex" : "hidden md:flex")}>{children}</section>
    </div>
  );
}
