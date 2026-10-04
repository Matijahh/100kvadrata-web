"use client";

import CloseIcon from "@assets/icons/close-icon.svg";
import ImageIcon from "@assets/icons/image-icon.svg";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/cn";
import type { NewListingDraft, SelectedVideoAsset } from "@/types/types";
import { confirmDestructiveAction } from "@/utils/confirmAction";
import { IMAGE_PRESETS, optimizeImage } from "@/utils/mediaOptimizer";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export const MAX_PHOTOS = 15;

/**
 * Photos or a video for a new listing — the web's version of the app's
 * NewListingStepTwo. Same rules (up to 15 photos or exactly one video, never
 * both; switching asks first), plus what a desktop is good at: drag files in,
 * and drag photos to set their order (the first is the cover).
 *
 * Files are kept as blob: URLs in the draft; nothing is compressed or uploaded
 * until Publish, exactly as in the app.
 */
export function ListingMediaStep({
  draft,
  onChange,
}: {
  draft: NewListingDraft;
  onChange: (next: Pick<NewListingDraft, "mediaMode" | "photos" | "video">) => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setDragActive] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addPhotos = async (files: File[]) => {
    const remaining = MAX_PHOTOS - (draft.mediaMode === "photos" ? draft.photos.length : 0);
    if (remaining <= 0) {
      showToast({ type: "error", message: t("newListing.maxPhotosError") });
      return;
    }
    if (files.length > remaining) {
      showToast({ type: "error", message: t("newListing.maxPhotosError") });
    }
    // HEIC (iPhone) cannot be previewed outside Safari, so those are converted
    // to JPEG straight away; everything else stays the original until Publish.
    const urls = await Promise.all(
      files.slice(0, remaining).map(async (file) => {
        const url = URL.createObjectURL(file);
        if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
          return (await optimizeImage(url, IMAGE_PRESETS.listingPhoto)).uri;
        }
        return url;
      }),
    );
    const apply = () =>
      onChange({
        mediaMode: "photos",
        photos: [...(draft.mediaMode === "photos" ? draft.photos : []), ...urls],
        video: null,
      });

    if (draft.mediaMode === "video" && draft.video) {
      confirmDestructiveAction({
        title: t("newListing.replaceVideoTitle"),
        message: t("newListing.replaceVideoMessage"),
        confirmLabel: t("newListing.replaceAction"),
        onConfirm: apply,
      });
      return;
    }
    apply();
  };

  const setVideo = (file: File) => {
    const video: SelectedVideoAsset = {
      uri: URL.createObjectURL(file),
      fileName: file.name,
      mimeType: file.type || null,
    };
    const apply = () => onChange({ mediaMode: "video", video, photos: [] });

    if (draft.mediaMode === "photos" && draft.photos.length > 0) {
      confirmDestructiveAction({
        title: t("newListing.replacePhotosTitle"),
        message: t("newListing.replacePhotosMessage"),
        confirmLabel: t("newListing.replaceAction"),
        onConfirm: apply,
      });
      return;
    }
    apply();
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const videos = files.filter((file) => file.type.startsWith("video/"));
    // HEIC often arrives with an empty type; treat any non-video as a photo
    // candidate and let the optimizer convert it.
    const photos = files.filter(
      (file) => file.type.startsWith("image/") || (!file.type && /\.(hei[cf]|jpe?g|png|webp)$/i.test(file.name)),
    );

    if (videos.length > 0) {
      setVideo(videos[0]);
      return;
    }
    if (photos.length > 0) {
      void addPhotos(photos);
      return;
    }
    showToast({ type: "error", message: t("web.newListing.unsupportedFile") });
  };

  const removePhoto = (uri: string) => {
    const photos = draft.photos.filter((photo) => photo !== uri);
    onChange({ mediaMode: photos.length > 0 ? "photos" : null, photos, video: null });
  };

  const clearVideo = () => onChange({ mediaMode: null, photos: [], video: null });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = draft.photos.indexOf(String(active.id));
    const to = draft.photos.indexOf(String(over.id));
    onChange({ mediaMode: "photos", photos: arrayMove(draft.photos, from, to), video: null });
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-[28px] border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border bg-surface-muted hover:border-primary-soft",
        )}
      >
        <ImageIcon width={36} height={36} className="text-primary" aria-hidden />
        <span className="font-display text-lg text-text">
          {isDragActive ? t("web.newListing.dropzoneActive") : t("web.newListing.dropzoneTitle")}
        </span>
        <span className="text-sm text-text-muted">{t("web.newListing.dropzoneHint")}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.heic,.heif"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {draft.mediaMode === "photos" && draft.photos.length > 0 ? (
        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold text-text">
              {t("newListing.selectedPhotos")} ({draft.photos.length}/{MAX_PHOTOS})
            </h3>
            <p className="text-xs text-text-muted">{t("web.newListing.reorderHint")}</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draft.photos} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {draft.photos.map((uri, index) => (
                  <SortablePhoto key={uri} uri={uri} isCover={index === 0} onRemove={() => removePhoto(uri)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      {draft.mediaMode === "video" && draft.video ? (
        <div>
          <h3 className="mb-3 font-semibold text-text">{t("newListing.selectedVideo")}</h3>
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-black">
            {/* Local file, so previewing it costs no network. */}
            <video src={draft.video.uri} controls playsInline className="aspect-[9/16] w-full object-contain" />
            <button
              type="button"
              onClick={clearVideo}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/75"
            >
              <CloseIcon width={14} height={14} aria-hidden />
              {t("newListing.removeVideo")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SortablePhoto({ uri, isCover, onRemove }: { uri: string; isCover: boolean; onRemove: () => void }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: uri });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative aspect-square touch-none overflow-hidden rounded-2xl bg-media-placeholder",
        isDragging && "z-10 opacity-80 shadow-xl",
      )}
      {...attributes}
      {...listeners}
    >
      {/* Blob URLs of local files — next/image cannot (and need not) optimise them. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={uri} alt="" className="h-full w-full cursor-grab object-cover active:cursor-grabbing" draggable={false} />
      {isCover ? (
        <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-text-on-primary">
          {t("web.newListing.cover")}
        </span>
      ) : null}
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onRemove}
        aria-label={t("newListing.remove")}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
      >
        <CloseIcon width={14} height={14} aria-hidden />
      </button>
    </li>
  );
}
