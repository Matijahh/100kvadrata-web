"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import CloseIcon from "@assets/icons/close-icon.svg";
import FlagIcon from "@assets/icons/flag-icon.svg";
import HouseIcon from "@assets/icons/house-icon.svg";
import PlayFilledIcon from "@assets/icons/play-icon-filled.svg";
import { ChatComposer, type PendingAttachment } from "@/components/chat/ChatComposer";
import Avatar from "@/components/genericComponents/Avatar";
import { AdminBadge } from "@/components/profile/AdminBadge";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { fetchConversationById, fetchMessages, markMessagesAsRead, sendMessage } from "@/services/chat";
import { fetchListingById } from "@/services/listings";
import { blockUser, type ReportReason, reportUser } from "@/services/reports";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Message, MessageListing } from "@/types/types";
import { confirmDestructiveAction, promptDestructiveChoice } from "@/utils/confirmAction";
import { getListingPriceLabel } from "@/utils/listingPrice";
import { formatClockTime, formatDayLabel, localDayKey } from "@/utils/relativeTime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const ListingLightbox = dynamic(() => import("@/components/listing/ListingLightbox"), { ssr: false });

// The fallback while the Realtime channel isn't live (or never is, on a
// database without the realtime migration) — same as the app. React Query
// pauses it while the tab is hidden.
const MESSAGES_REFRESH_MS = 5000;
// How close to the bottom still counts as following the conversation.
const FOLLOW_THRESHOLD = 24;

export type SendPayload = {
  content: string | null;
  listing: MessageListing | null;
  attachments: PendingAttachment[];
};

/**
 * One conversation — web port of the app's chat/[conversationId]: live
 * updates (Realtime, 5 s polling until it connects), day headings, the
 * listing it is about under the header, text + photos/videos + the listing link carried over from a
 * listing's Message button, report and block. Opened from a listing, the
 * link arrives as ?listingRef=…&listingId=… exactly like the app's params.
 */
export function ChatView({ conversationId }: { conversationId: string }) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const myId = sessionUser?.id ?? null;
  const listRef = useRef<HTMLDivElement>(null);
  const isFollowing = useRef(true);

  const [initialListing] = useState<MessageListing | null>(() => {
    const listingRef = searchParams.get("listingRef");
    const listingId = Number(searchParams.get("listingId"));
    return listingRef && Number.isFinite(listingId) && listingId > 0
      ? { id: listingId, displayText: listingRef }
      : null;
  });
  const [pendingSend, setPendingSend] = useState<SendPayload | null>(null);
  const [restoreDraft, setRestoreDraft] = useState<SendPayload | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // The link is in the composer now; drop it from the address so a reload
  // does not attach it again.
  useEffect(() => {
    if (initialListing) window.history.replaceState(null, "", window.location.pathname);
  }, [initialListing]);

  const conversationQuery = useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => fetchConversationById(conversationId, myId!),
    enabled: !!myId,
    retry: false,
  });
  const conversation = conversationQuery.data;
  const otherUser = conversation?.otherUser ?? null;

  // New messages arrive through Supabase Realtime (inserts on `messages` for
  // this conversation; RLS limits them to its two participants). Until the
  // channel is live, the conversation keeps polling.
  const [isRealtimeLive, setRealtimeLive] = useState(false);
  useEffect(() => {
    if (!myId) return;

    const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        refresh,
      )
      .subscribe((status) => {
        setRealtimeLive(status === "SUBSCRIBED");
        // Anything sent while the channel was connecting is fetched once.
        if (status === "SUBSCRIBED") refresh();
      });

    return () => {
      setRealtimeLive(false);
      void supabase.removeChannel(channel);
    };
  }, [conversationId, myId, queryClient]);

  const messagesQuery = useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    enabled: !!myId && !conversationQuery.isError,
    refetchInterval: isRealtimeLive ? false : MESSAGES_REFRESH_MS,
  });
  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);

  // The listing the conversation is about: the one it was started from, or
  // the last one either side linked in a message.
  const stripListingId =
    conversation?.listingId ?? [...messages].reverse().find((message) => message.listing)?.listing?.id ?? null;
  const stripListingQuery = useQuery({
    queryKey: queryKeys.listing(String(stripListingId ?? "none")),
    queryFn: () => fetchListingById(stripListingId!),
    enabled: stripListingId != null,
    staleTime: 5 * 60 * 1000,
  });
  const stripListing = stripListingId != null ? (stripListingQuery.data ?? null) : null;
  const stripPhoto = stripListing
    ? ([...(stripListing.media ?? [])]
        .filter((media) => media.kind === "photo")
        .sort((a, b) => a.sort_order - b.sort_order)[0]?.public_url ?? null)
    : null;

  // A heading before the first message of each day.
  const listRows = useMemo(() => {
    const rows: ({ kind: "day"; key: string; label: string } | { kind: "message"; key: string; message: Message })[] =
      [];
    let previousDay: string | null = null;
    for (const message of messages) {
      const day = localDayKey(message.createdAt);
      if (day !== previousDay) {
        rows.push({ kind: "day", key: `day-${day}`, label: formatDayLabel(message.createdAt, t, i18n.language) });
        previousDay = day;
      }
      rows.push({ kind: "message", key: message.id, message });
    }
    return rows;
  }, [messages, t, i18n.language]);

  // Marked read on open, and again whenever something new arrives while the
  // conversation is on screen (the app only does the first; on a desktop the
  // chat often stays open for a long time).
  const hasUnreadIncoming = messages.some((message) => !message.isRead && message.senderId !== myId);
  useEffect(() => {
    if (!myId || !hasUnreadIncoming) return;

    const markRead = () => {
      if (document.visibilityState !== "visible") return;
      void markMessagesAsRead(conversationId, myId).then(() =>
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations(myId) }),
      );
    };

    markRead();
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [conversationId, myId, hasUnreadIncoming, queryClient]);

  // --- Following the newest message ---------------------------------------

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const list = listRef.current;
    if (list && isFollowing.current) list.scrollTo({ top: list.scrollHeight, behavior });
  }, []);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    isFollowing.current = list.scrollHeight - list.scrollTop - list.clientHeight <= FOLLOW_THRESHOLD;
  };

  const lastMessageId = messages[messages.length - 1]?.id;
  useLayoutEffect(() => {
    scrollToLatest();
  }, [lastMessageId, pendingSend, scrollToLatest]);

  // --- Sending -----------------------------------------------------------------

  const send = async (payload: SendPayload) => {
    if (!myId) return;
    isFollowing.current = true;
    setPendingSend(payload);
    try {
      await sendMessage(conversationId, myId, {
        content: payload.content,
        listingId: payload.listing?.id ?? null,
        attachments: payload.attachments.map(({ uri, mimeType, mediaType }) => ({ uri, mimeType, mediaType })),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations(myId) });
    } catch (error) {
      console.error("[chat] send failed:", error);
      showToast({ type: "error", message: t("chat.sendMessageFailed") });
      // Unlike the app, hand the message back to the composer rather than
      // losing it.
      setRestoreDraft(payload);
    } finally {
      setPendingSend(null);
    }
  };

  // --- Report / block ------------------------------------------------------------

  const submitUserReport = async (reason: ReportReason) => {
    if (!myId || !otherUser) return;
    try {
      await reportUser(myId, otherUser.id, reason);
      showToast({ type: "success", title: t("report.submittedTitle"), message: t("report.submittedMessage") });
    } catch {
      showToast({ type: "error", message: t("report.submitFailed") });
    }
  };

  const handleReportUser = () =>
    promptDestructiveChoice({
      title: t("report.userTitle"),
      message: t("report.reasonPrompt"),
      options: [
        { label: t("report.reasonSpam"), onPress: () => submitUserReport("spam") },
        { label: t("report.reasonInappropriate"), onPress: () => submitUserReport("inappropriate") },
      ],
    });

  const handleBlockUser = () => {
    if (!otherUser) return;
    confirmDestructiveAction({
      title: t("report.blockTitle"),
      message: t("report.blockMessage", { username: otherUser.username }),
      confirmLabel: t("report.blockConfirm"),
      onConfirm: async () => {
        if (!myId) return;
        try {
          await blockUser(myId, otherUser.id);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.blockedUserIds(myId) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations(myId) }),
          ]);
          router.replace("/inbox");
        } catch {
          showToast({ type: "error", message: t("report.blockFailed") });
        }
      },
    });
  };

  const handleModerationMenu = () =>
    promptDestructiveChoice({
      title: otherUser?.username ?? "",
      message: t("report.menuPrompt"),
      options: [
        { label: t("report.reportUser"), onPress: handleReportUser },
        { label: t("report.blockUser"), onPress: handleBlockUser, destructive: true },
      ],
    });

  // --- Rendering -------------------------------------------------------------------

  // Every photo in the conversation, so the viewer can step through them.
  const photoAttachments = useMemo(
    () => messages.flatMap((message) => (message.attachments ?? []).filter((item) => item.mediaType === "image")),
    [messages],
  );

  if (conversationQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <EmptyState title={t("web.chat.notFound")}>
          <Link href="/inbox" className="font-semibold text-primary hover:underline">
            {t("web.chat.backToInbox")}
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-surface-muted">
      <header className="flex shrink-0 items-center gap-2 border-b border-divider bg-surface px-3 py-2.5 pt-[max(10px,env(safe-area-inset-top))] md:px-5">
        <Link
          href="/inbox"
          aria-label={t("web.chat.backToInbox")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-surface-muted md:hidden"
        >
          <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1">
          <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-muted">
            <Avatar userId={otherUser?.id} avatarUrl={otherUser?.avatarUrl} />
          </span>
          {otherUser ? (
            <Link href={`/user/${otherUser.id}`} className="truncate text-base font-semibold text-text hover:underline">
              {otherUser.username}
            </Link>
          ) : null}
          {otherUser?.isAdmin ? <AdminBadge compact /> : null}
        </div>
        {otherUser ? (
          <button
            type="button"
            onClick={handleModerationMenu}
            aria-label={t("web.chat.moderation")}
            title={t("web.chat.moderation")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
          >
            <FlagIcon width={20} height={20} aria-hidden />
          </button>
        ) : null}
      </header>

      {/* What the conversation is about, one click from the listing. */}
      {stripListing ? (
        <Link
          href={`/listing/${stripListing.id}`}
          aria-label={t("chat.openListing")}
          className="flex shrink-0 items-center gap-3 border-b border-divider bg-surface px-4 py-2.5 transition-colors hover:bg-surface-muted md:px-6"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-media-placeholder text-text-muted">
            {stripPhoto ? (
              <Image src={stripPhoto} alt="" fill sizes="44px" className="object-cover" />
            ) : (
              <HouseIcon width={18} height={18} aria-hidden />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-display text-base text-primary">
              {getListingPriceLabel(stripListing, t) ?? t("chat.viewListing")}
            </span>
            <span className="truncate text-xs text-text-muted">
              {[
                stripListing.category ? t(`newListing.categories.${stripListing.category}`) : null,
                stripListing.municipality || stripListing.city,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-primary">{t("chat.viewListing")}</span>
        </Link>
      ) : null}

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        aria-live="polite"
      >
        {messagesQuery.isLoading || conversationQuery.isLoading ? (
          <Spinner className="py-20" />
        ) : messages.length === 0 && !pendingSend ? (
          <p className="px-6 py-20 text-center text-sm text-text-muted">{t("chat.emptyState")}</p>
        ) : (
          <ol className="mx-auto flex max-w-page flex-col gap-2 p-4 md:px-6">
            {listRows.map((row) =>
              row.kind === "day" ? (
                <li key={row.key} className="my-1.5 self-center">
                  <h2 className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-muted">{row.label}</h2>
                </li>
              ) : (
                <MessageBubble
                  key={row.key}
                  message={row.message}
                  isOwn={row.message.senderId === myId}
                  onImageLoad={() => scrollToLatest()}
                  onOpenImage={(url) => setLightboxIndex(photoAttachments.findIndex((item) => item.url === url))}
                  onOpenVideo={setVideoUrl}
                />
              ),
            )}
            {pendingSend ? <PendingBubble payload={pendingSend} /> : null}
          </ol>
        )}
      </div>

      <ChatComposer
        initialListing={initialListing}
        isSending={!!pendingSend}
        onSend={send}
        restoreDraft={restoreDraft}
        onDraftRestored={() => setRestoreDraft(null)}
      />

      {lightboxIndex != null && lightboxIndex >= 0 ? (
        <ListingLightbox
          photos={photoAttachments.map((item) => ({ src: item.url, alt: "" }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}

      <Dialog.Root open={videoUrl !== null} onOpenChange={(open) => (open ? undefined : setVideoUrl(null))}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/95" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none">
            <Dialog.Title className="sr-only">{t("web.chat.playVideo")}</Dialog.Title>
            <Dialog.Description className="sr-only">{t("web.chat.playVideo")}</Dialog.Description>
            {videoUrl ? (
              // Only now is the file fetched — the bubble shows a tile, not a frame.
              <video src={videoUrl} controls autoPlay playsInline className="max-h-full max-w-full" />
            ) : null}
            <Dialog.Close
              aria-label={t("web.chat.closeViewer")}
              className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <CloseIcon width={22} height={22} aria-hidden />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function bubbleClasses(isOwn: boolean) {
  return cn(
    // 75% like the app, but never wider than a comfortable line (~70 characters).
    "flex max-w-[min(75%,40rem)] flex-col gap-1.5 rounded-[18px] px-3.5 py-2.5",
    isOwn ? "rounded-br-[4px] bg-primary text-text-on-primary" : "rounded-bl-[4px] bg-surface-elevated text-text",
  );
}

function MessageBubble({
  message,
  isOwn,
  onImageLoad,
  onOpenImage,
  onOpenVideo,
}: {
  message: Message;
  isOwn: boolean;
  onImageLoad: () => void;
  onOpenImage: (url: string) => void;
  onOpenVideo: (url: string) => void;
}) {
  const { t } = useTranslation();
  const attachments = message.attachments ?? [];
  if (!message.content && !message.listing && attachments.length === 0) return null;

  return (
    <li className={cn("flex flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
      <div className={bubbleClasses(isOwn)} title={new Date(message.createdAt).toLocaleString()}>
        {message.listing ? (
          <Link
            href={`/listing/${message.listing.id}`}
            className={cn("text-[13px] font-semibold underline", isOwn ? "text-text-on-primary" : "text-primary")}
          >
            {message.listing.displayText}
          </Link>
        ) : null}
        {message.content ? (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[21px]">{message.content}</p>
        ) : null}
        {attachments.map((attachment) =>
          attachment.mediaType === "image" ? (
            <button
              key={attachment.id}
              type="button"
              onClick={() => onOpenImage(attachment.url)}
              className="relative block h-[140px] w-[200px] max-w-full cursor-zoom-in overflow-hidden rounded-[10px] bg-media-placeholder"
            >
              <Image src={attachment.url} alt="" fill sizes="200px" className="object-cover" onLoad={onImageLoad} />
            </button>
          ) : (
            <button
              key={attachment.id}
              type="button"
              onClick={() => onOpenVideo(attachment.url)}
              aria-label={t("web.chat.playVideo")}
              className="flex h-[140px] w-[200px] max-w-full items-center justify-center rounded-[10px] bg-[#1F1F1F] text-white"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <PlayFilledIcon width={22} height={22} aria-hidden />
              </span>
            </button>
          ),
        )}
      </div>
      <span className="px-1 text-[11px] text-text-muted tabular-nums">{formatClockTime(message.createdAt)}</span>
    </li>
  );
}

/** What is being sent right now, so a slow upload is visibly happening. */
function PendingBubble({ payload }: { payload: SendPayload }) {
  const { t } = useTranslation();

  return (
    <li className="flex flex-col items-end gap-1 opacity-60">
      <div className={bubbleClasses(true)}>
        {payload.listing ? <p className="text-[13px] font-semibold underline">{payload.listing.displayText}</p> : null}
        {payload.content ? (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[21px]">{payload.content}</p>
        ) : null}
        {payload.attachments.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {payload.attachments.map((attachment) =>
              attachment.mediaType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={attachment.localId} src={attachment.uri} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <span
                  key={attachment.localId}
                  className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#1F1F1F] text-white"
                >
                  <PlayFilledIcon width={16} height={16} aria-hidden />
                </span>
              ),
            )}
          </div>
        ) : null}
      </div>
      <span className="text-[11px] text-text-muted">{t("web.chat.sending")}</span>
    </li>
  );
}
