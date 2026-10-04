"use client";

import PlayFilledIcon from "@assets/icons/play-icon-filled.svg";
import { useVideoPoster } from "@/hooks/useVideoPoster";
import { cn } from "@/lib/cn";
import { useRef } from "react";

/**
 * A video shown as a picture: its first frame (captured once, cached — see
 * lib/videoPoster) under a play mark. Dark until the frame is ready, which is
 * what video tiles looked like before. For tiles and rows that link
 * somewhere rather than play.
 */
export function VideoPoster({
  videoUrl,
  size = "large",
  dimmed = false,
  className,
}: {
  videoUrl: string;
  /** The play mark: large on cards, small on thumbnails. */
  size?: "large" | "small";
  /** Grey the frame out (expired listings on the owner's profile). */
  dimmed?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const poster = useVideoPoster(videoUrl, { targetRef: ref });

  return (
    <div ref={ref} className={cn("relative h-full w-full overflow-hidden bg-[#1F1F1F]", className)}>
      {poster ? (
        // A data: URL captured in the browser — nothing for next/image to optimise.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className={cn("absolute inset-0 h-full w-full object-cover", dimmed && "grayscale")}
        />
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-black/45 text-white",
            size === "large" ? "h-12 w-12" : "h-7 w-7",
          )}
        >
          <PlayFilledIcon width={size === "large" ? 22 : 12} height={size === "large" ? 22 : 12} aria-hidden />
        </span>
      </span>
    </div>
  );
}
