"use client";

import { getCachedPoster, loadPoster } from "@/lib/videoPoster";
import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * A still frame for a video — for places that show a video without playing it
 * (grid tiles, the listing page before Play, pickers). Web port of the app's
 * useVideoThumbnail: pass `enabled: false` whenever there is a photo to show
 * instead, because capturing a frame means fetching part of the video.
 *
 * With `targetRef`, capturing waits until that element is near the viewport,
 * so a grid only pays for the tiles someone scrolls to. The cache is read
 * after mount (it lives in localStorage), so server and client render alike.
 */
export function useVideoPoster(
  videoUrl: string | null,
  { enabled = true, targetRef }: { enabled?: boolean; targetRef?: RefObject<HTMLElement | null> } = {},
): string | null {
  const [poster, setPoster] = useState<{ url: string | null; dataUrl: string | null }>({
    url: null,
    dataUrl: null,
  });
  const urlRef = useRef(videoUrl);
  urlRef.current = videoUrl;

  useEffect(() => {
    if (!videoUrl || !enabled) return;

    const cached = getCachedPoster(videoUrl);
    if (cached) {
      setPoster({ url: videoUrl, dataUrl: cached });
      return;
    }

    let cancelled = false;
    const capture = () => {
      void loadPoster(videoUrl).then((dataUrl) => {
        if (!cancelled && urlRef.current === videoUrl) setPoster({ url: videoUrl, dataUrl });
      });
    };

    const target = targetRef?.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      capture();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          capture();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [videoUrl, enabled, targetRef]);

  return poster.url === videoUrl ? poster.dataUrl : null;
}
