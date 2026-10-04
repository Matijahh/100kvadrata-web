// Still frames for video-only listings — the web's version of the app's
// videoThumbnailCache. Drawing a frame means fetching part of the video, which
// was once the app's largest source of Supabase egress, so the same rules
// apply: one capture per video per browser (memory + localStorage), and only
// a couple run at once.
//
// The download is capped: uploads are fast-start MP4s (the moov index sits
// before the media data), so the first HEAD_BYTES hold the index and the
// opening seconds — enough to decode frame one from a local blob. Only a file
// that cannot be read that way falls back to letting the browser stream it,
// cut off as soon as the frame is drawn.

const STORAGE_PREFIX = "100m2.videoPoster:";
const INDEX_KEY = "100m2.videoPosterIndex";
const MAX_ENTRIES = 60;
const MAX_EDGE = 480;
const QUALITY = 0.72;
// Just past the start: some videos open on a black or fading frame.
const FRAME_AT_SECONDS = 0.1;
const CAPTURE_TIMEOUT_MS = 15_000;
// The index (~10-15 KB) plus the first frames at the app's 1.2 Mbps.
const HEAD_BYTES = 256 * 1024;
const MAX_CONCURRENT = 2;

const memory = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();
const queue: (() => void)[] = [];
let running = 0;

const readIndex = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(INDEX_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
};

const writeIndex = (index: string[]) => {
  try {
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // Storage full or blocked: the in-memory copy still serves this visit.
  }
};

/** The cached frame for a video, or null. Synchronous; browser only. */
export const getCachedPoster = (videoUrl: string): string | null => {
  const hit = memory.get(videoUrl);
  if (hit) return hit;
  try {
    const stored = window.localStorage.getItem(STORAGE_PREFIX + videoUrl);
    if (stored) memory.set(videoUrl, stored);
    return stored;
  } catch {
    return null;
  }
};

const storePoster = (videoUrl: string, dataUrl: string) => {
  memory.set(videoUrl, dataUrl);
  const index = readIndex().filter((url) => url !== videoUrl);
  index.push(videoUrl);
  // Oldest first out, so the cache stays a few megabytes at most.
  while (index.length > MAX_ENTRIES) {
    const evicted = index.shift()!;
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + evicted);
    } catch {
      // Ignore.
    }
  }
  try {
    window.localStorage.setItem(STORAGE_PREFIX + videoUrl, dataUrl);
  } catch {
    // Over quota: make room by dropping the older half, then try once more.
    index.splice(0, Math.floor(index.length / 2)).forEach((url) => {
      try {
        window.localStorage.removeItem(STORAGE_PREFIX + url);
      } catch {
        // Ignore.
      }
    });
    try {
      window.localStorage.setItem(STORAGE_PREFIX + videoUrl, dataUrl);
    } catch {
      // Still no room: memory only.
    }
  }
  writeIndex(index);
};

const runQueued = <T,>(task: () => Promise<T>) =>
  new Promise<T>((resolve, reject) => {
    const start = () => {
      running += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          running -= 1;
          queue.shift()?.();
        });
    };
    if (running < MAX_CONCURRENT) start();
    else queue.push(start);
  });

/** Draws a frame of `src` into a JPEG data URL; null if it cannot. */
const frameFrom = (src: string, crossOrigin: boolean, preload: "metadata" | "auto") =>
  new Promise<string | null>((resolve) => {
    const video = document.createElement("video");
    let settled = false;

    const finish = (result: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      // Detaching the source aborts the rest of the download.
      video.removeAttribute("src");
      video.load();
      resolve(result);
    };

    const timer = window.setTimeout(() => finish(null), CAPTURE_TIMEOUT_MS);

    video.addEventListener("error", () => finish(null), { once: true });
    video.addEventListener(
      "loadeddata",
      () => {
        if (video.currentTime < FRAME_AT_SECONDS / 2) video.currentTime = FRAME_AT_SECONDS;
        else draw();
      },
      { once: true },
    );
    video.addEventListener("seeked", () => draw(), { once: true });

    function draw() {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return finish(null);
      const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      try {
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", QUALITY));
      } catch {
        // A tainted canvas (no CORS) — nothing to keep.
        finish(null);
      }
    }

    if (crossOrigin) video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = preload;
    video.src = `${src}#t=${FRAME_AT_SECONDS}`;
  });

const grabFrame = async (videoUrl: string) => {
  // Capped: fetch the head of the file and decode it locally.
  try {
    const response = await fetch(videoUrl, { headers: { Range: `bytes=0-${HEAD_BYTES - 1}` } });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: "video/mp4" }));
      try {
        const frame = await frameFrom(blobUrl, false, "auto");
        if (frame) return frame;
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    }
  } catch {
    // Network or CORS trouble: try the stream below.
  }
  // Not fast-start (or the head was not enough): stream, preloading as little
  // as the browser allows, and stop at the first frame.
  return frameFrom(videoUrl, true, "metadata");
};

/** A still frame for the video: cached if there is one, captured (once) if not. */
export const loadPoster = (videoUrl: string): Promise<string | null> => {
  const cached = getCachedPoster(videoUrl);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(videoUrl);
  if (pending) return pending;

  const capture = runQueued(() => grabFrame(videoUrl))
    .then((dataUrl) => {
      if (dataUrl) storePoster(videoUrl, dataUrl);
      return dataUrl;
    })
    .finally(() => inFlight.delete(videoUrl));
  inFlight.set(videoUrl, capture);
  return capture;
};
