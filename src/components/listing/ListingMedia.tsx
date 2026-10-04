"use client";

import ChevronLeftIcon from "@assets/icons/chevron-left-icon.svg";
import PlayFilledIcon from "@assets/icons/play-icon-filled.svg";
import { useVideoPoster } from "@/hooks/useVideoPoster";
import { cn } from "@/lib/cn";
import { splitListingMedia } from "@/lib/listingFormat";
import type { Listing } from "@/types/types";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const ListingLightbox = dynamic(() => import("@/components/listing/ListingLightbox"), {
  ssr: false,
});

/**
 * A listing's photos or video, filling whatever box the parent gives it.
 *
 * Photos: a swipeable strip (scroll-snap) with arrows on desktop, dots, and a
 * zoomable full-screen viewer on click. Images go through next/image, so the
 * browser gets a right-sized WebP/AVIF and Supabase serves each original about
 * once (Vercel caches the variants) — the egress lesson from the app.
 *
 * Video: the source is only attached while `isActive`, and nothing is
 * preloaded, because any <video> with a src starts downloading — the same rule
 * that fixed the app's egress (useVideoPlayer). The first photo stands in as a
 * poster until playback starts.
 */
export function ListingMedia({
  listing,
  isActive,
  autoPlay = false,
  priority = false,
  sizes = "(min-width: 768px) 60vw, 100vw",
  dotsPosition = "bottom",
  minimalVideo = false,
  className,
}: {
  listing: Listing;
  /** Whether this listing is the one on screen (detail page: always). */
  isActive: boolean;
  /** Reel mode: start muted as soon as the card is active. */
  autoPlay?: boolean;
  /** Above the fold on first load (detail page hero). */
  priority?: boolean;
  sizes?: string;
  /** The reel's phone layout keeps the bottom for the price and actions. */
  dotsPosition?: "top" | "bottom";
  /** Reel on phones: no native controls (they sit under the overlay) — tap to pause, a mute button. */
  minimalVideo?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const { photos, videoUrl, showVideo, showPhotos } = splitListingMedia(listing);

  return (
    <div className={cn("relative overflow-hidden bg-media-placeholder", className)}>
      {showVideo && videoUrl ? (
        <ListingVideo
          src={videoUrl}
          poster={photos[0]?.public_url ?? null}
          isActive={isActive}
          autoPlay={autoPlay}
          minimal={minimalVideo}
          sizes={sizes}
        />
      ) : showPhotos ? (
        <PhotoStrip
          photos={photos.map((photo) => photo.public_url)}
          alt={listing.description?.slice(0, 120) ?? t("listing.title")}
          priority={priority}
          sizes={sizes}
          dotsPosition={dotsPosition}
        />
      ) : (
        <div className="flex h-full items-center justify-center font-semibold text-media-placeholder-text">
          {t("common.noMediaAvailable")}
        </div>
      )}
    </div>
  );
}

function PhotoStrip({
  photos,
  alt,
  priority,
  sizes,
  dotsPosition,
}: {
  photos: string[];
  alt: string;
  priority: boolean;
  sizes: string;
  dotsPosition: "top" | "bottom";
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scrollTo = (index: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, index));
    strip.scrollTo({ left: clamped * strip.clientWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const strip = stripRef.current;
    if (!strip || strip.clientWidth === 0) return;
    const next = Math.round(strip.scrollLeft / strip.clientWidth);
    if (next !== activeIndex) setActiveIndex(next);
  };

  return (
    <div className="group relative h-full w-full">
      <div
        ref={stripRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="relative h-full w-full shrink-0 snap-center cursor-zoom-in"
            aria-label={`${index + 1} / ${photos.length}`}
          >
            <Image
              src={src}
              alt={index === 0 ? alt : ""}
              fill
              sizes={sizes}
              priority={priority && index === 0}
              loading={priority && index === 0 ? undefined : "lazy"}
              className="object-contain"
            />
          </button>
        ))}
      </div>

      {photos.length > 1 ? (
        <>
          <StripArrow direction="prev" hidden={activeIndex === 0} onClick={() => scrollTo(activeIndex - 1)} />
          <StripArrow
            direction="next"
            hidden={activeIndex === photos.length - 1}
            onClick={() => scrollTo(activeIndex + 1)}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 flex justify-center gap-1.5",
              dotsPosition === "top" ? "top-4" : "bottom-4",
            )}
            aria-hidden
          >
            {photos.map((src, index) => (
              <span
                key={src}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === activeIndex ? "w-5 bg-surface" : "w-2 bg-white/45",
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      {lightboxIndex != null ? (
        <ListingLightbox
          photos={photos.map((src) => ({ src, alt }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(index) => {
            setLightboxIndex(index);
            scrollTo(index);
          }}
        />
      ) : null}
    </div>
  );
}

function StripArrow({
  direction,
  hidden,
  onClick,
}: {
  direction: "prev" | "next";
  hidden: boolean;
  onClick: () => void;
}) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "‹" : "›"}
      className={cn(
        "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/60 focus-visible:opacity-100 group-hover:opacity-100 md:flex",
        direction === "prev" ? "left-3" : "right-3",
      )}
    >
      <ChevronLeftIcon width={20} height={20} className={direction === "next" ? "rotate-180" : undefined} aria-hidden />
    </button>
  );
}

// Once a viewer turns the sound on in the reel it stays on for the next
// videos, the way the app plays them; the first one has to start muted
// because browsers refuse unmuted autoplay before any interaction.
let reelSoundOn = false;

function ListingVideo({
  src,
  poster,
  isActive,
  autoPlay,
  minimal,
  sizes,
}: {
  src: string;
  poster: string | null;
  isActive: boolean;
  autoPlay: boolean;
  minimal: boolean;
  sizes: string;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  // Whether the viewer asked for playback on a non-autoplay player.
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [isMuted, setMuted] = useState(true);
  const shouldAttach = isActive && (autoPlay || hasStarted);
  // A video-only listing has no photo to stand in before playback, so it
  // shows the video's own first frame (captured once, cached). Not while
  // playing: the player is already fetching the file.
  const capturedPoster = useVideoPoster(src, { enabled: !poster && !shouldAttach });

  // Leaving the card releases the source (and stops the download); coming
  // back starts over, like the app.
  useEffect(() => {
    if (!isActive) {
      setHasStarted(false);
      setPaused(false);
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldAttach) return;
    // A click on Play is permission for sound; autoplay is not.
    const startMuted = autoPlay && !hasStarted && !reelSoundOn;
    video.muted = startMuted;
    setMuted(startMuted);
    video.play().catch(() => {
      // Unmuted autoplay refused (no interaction yet): fall back to muted.
      if (!video.muted) {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => undefined);
      }
    });
    // Only on attach — mute toggles must not restart playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAttach]);

  const togglePaused = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const toggleMuted = () => {
    const video = videoRef.current;
    const next = !isMuted;
    reelSoundOn = !next;
    setMuted(next);
    if (video) video.muted = next;
  };

  if (!shouldAttach) {
    return (
      <div className="relative h-full w-full bg-black">
        <button
          type="button"
          onClick={() => setHasStarted(true)}
          aria-label={t("web.listing.playVideo")}
          className="relative flex h-full w-full items-center justify-center"
        >
          {poster ? (
            <Image src={poster} alt="" fill sizes={sizes} className="object-contain" />
          ) : capturedPoster ? (
            // A data: URL captured in the browser — nothing for next/image to do.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedPoster} alt="" className="absolute inset-0 h-full w-full object-contain" />
          ) : null}
          <span className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-black/45 text-white">
            <PlayFilledIcon width={34} height={34} aria-hidden />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? capturedPoster ?? undefined}
        preload="none"
        playsInline
        loop
        controls={!minimal}
        muted={isMuted}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onClick={minimal ? togglePaused : undefined}
        className="h-full w-full object-contain"
      />
      {minimal ? (
        <>
          {isPaused ? (
            <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white">
              <PlayFilledIcon width={34} height={34} aria-hidden />
            </span>
          ) : null}
          <button
            type="button"
            onClick={toggleMuted}
            aria-label={isMuted ? t("web.feed.unmute") : t("web.feed.mute")}
            aria-pressed={!isMuted}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
          >
            <SpeakerIcon muted={isMuted} />
          </button>
        </>
      ) : null}
    </div>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
      {muted ? (
        <path d="m22 9-6 6M16 9l6 6" />
      ) : (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      )}
    </svg>
  );
}
