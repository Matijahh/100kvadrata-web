"use client";

import CloseIcon from "@assets/icons/close-icon.svg";
import HouseIcon from "@assets/icons/house-icon.svg";
import ImageIcon from "@assets/icons/image-icon.svg";
import PaperPlaneIcon from "@assets/icons/paper-plane-icon.svg";
import PlayCircleFilledIcon from "@assets/icons/play-circle-icon-filled.svg";
import type { SendPayload } from "@/components/chat/ChatView";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/cn";
import type { MessageListing } from "@/types/types";
import { containsObjectionableContent } from "@/utils/contentFilter";
import { IMAGE_PRESETS, optimizeImage } from "@/utils/mediaOptimizer";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type PendingAttachment = {
  localId: string;
  /** blob: URL of the picked (or HEIC-converted) file. */
  uri: string;
  mediaType: "image" | "video";
  mimeType: string;
};

const MAX_INPUT_HEIGHT = 140;

const isHeic = (file: File) => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

/**
 * The input bar: photos/videos (picker, paste or drop), the listing link
 * carried over from a listing, the text, Send. Enter sends on a keyboard;
 * on touch screens Enter is a new line and the button sends, like the app.
 */
export function ChatComposer({
  initialListing,
  isSending,
  onSend,
  restoreDraft,
  onDraftRestored,
}: {
  initialListing: MessageListing | null;
  isSending: boolean;
  onSend: (payload: SendPayload) => void;
  /** A send that failed, handed back so nothing typed is lost. */
  restoreDraft: SendPayload | null;
  onDraftRestored: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [listing, setListing] = useState<MessageListing | null>(initialListing);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isDragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!restoreDraft) return;
    setText((current) => current || restoreDraft.content || "");
    setListing((current) => current ?? restoreDraft.listing);
    setAttachments((current) => (current.length > 0 ? current : restoreDraft.attachments));
    onDraftRestored();
  }, [restoreDraft, onDraftRestored]);

  // Grows with the text up to a few lines, then scrolls.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [text]);

  const addFiles = async (fileList: FileList | File[] | null) => {
    const files = Array.from(fileList ?? []).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/") || isHeic(file),
    );
    if (files.length === 0) return;

    const picked = await Promise.all(
      files.map(async (file): Promise<PendingAttachment> => {
        const localId = `local-${Date.now()}-${Math.random()}`;
        if (file.type.startsWith("video/")) {
          return { localId, uri: URL.createObjectURL(file), mediaType: "video", mimeType: file.type || "video/mp4" };
        }
        // iPhone photos cannot be previewed outside Safari; convert up front.
        if (isHeic(file)) {
          const converted = await optimizeImage(URL.createObjectURL(file), IMAGE_PRESETS.chatImage);
          return { localId, uri: converted.uri, mediaType: "image", mimeType: converted.mimeType };
        }
        return { localId, uri: URL.createObjectURL(file), mediaType: "image", mimeType: file.type || "image/jpeg" };
      }),
    );
    setAttachments((current) => [...current, ...picked]);
  };

  const canSend = !isSending && (text.trim().length > 0 || listing !== null || attachments.length > 0);

  const submit = () => {
    if (!canSend) return;
    const content = text.trim() || null;

    // Same objectionable-content filter as the app; the text stays in the
    // input so it can be edited.
    if (containsObjectionableContent(content)) {
      showToast({ type: "error", message: t("moderation.blockedContent") });
      return;
    }

    onSend({ content, listing, attachments });
    setText("");
    setListing(null);
    setAttachments([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    event.preventDefault();
    submit();
  };

  const hasPreview = listing !== null || attachments.length > 0;

  return (
    <div
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        void addFiles(event.dataTransfer.files);
      }}
      className={cn(
        "shrink-0 border-t border-divider bg-surface pb-[max(10px,env(safe-area-inset-bottom))] transition-colors",
        isDragActive && "bg-primary/5",
      )}
    >
      {hasPreview ? (
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 pt-3">
          {listing ? (
            <div className="flex max-w-full items-center gap-2 self-start rounded-full bg-surface-muted py-1.5 pl-3 pr-1.5">
              <HouseIcon width={13} height={13} className="shrink-0 text-primary" aria-hidden />
              <span className="truncate text-[13px] text-text">{listing.displayText}</span>
              <button
                type="button"
                onClick={() => setListing(null)}
                aria-label={t("web.chat.removeListing")}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface"
              >
                <CloseIcon width={14} height={14} aria-hidden />
              </button>
            </div>
          ) : null}
          {attachments.length > 0 ? (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {attachments.map((attachment) => (
                <li key={attachment.localId} className="relative h-16 w-16 shrink-0">
                  {attachment.mediaType === "image" ? (
                    // Local blob — nothing for next/image to optimise.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={attachment.uri} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-media-placeholder text-white">
                      <PlayCircleFilledIcon width={28} height={28} aria-hidden />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((current) => current.filter((item) => item.localId !== attachment.localId))
                    }
                    aria-label={t("web.chat.removeAttachment")}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-text text-surface"
                  >
                    <CloseIcon width={11} height={11} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="mx-auto flex max-w-3xl items-end gap-2 px-3 pt-2.5 md:px-4"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t("web.chat.attach")}
          title={t("web.chat.attach")}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
        >
          <ImageIcon width={24} height={24} aria-hidden />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.heic,.heif"
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={(event) => {
            if (event.clipboardData.files.length > 0) {
              event.preventDefault();
              void addFiles(event.clipboardData.files);
            }
          }}
          placeholder={t("chat.inputPlaceholder")}
          aria-label={t("chat.inputPlaceholder")}
          title={t("web.chat.enterHint")}
          className="min-h-[42px] flex-1 resize-none rounded-[21px] border border-transparent bg-surface-muted px-4 py-[10px] text-[15px] leading-[20px] text-text placeholder:text-placeholder focus:border-primary-soft focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={isSending ? t("web.chat.sending") : t("chat.send")}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-primary text-text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isSending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-on-primary border-t-transparent" aria-hidden />
          ) : (
            <PaperPlaneIcon width={18} height={18} aria-hidden />
          )}
        </button>
      </form>
    </div>
  );
}
