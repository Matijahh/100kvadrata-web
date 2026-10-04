// Platform adapter — same exports as flatswipe/src/utils/mediaOptimizer.ts, so
// shared services (avatar upload, chat attachments) work unchanged. Inputs and
// outputs are `blob:` URLs (`URL.createObjectURL(file)`) instead of native file
// URIs; the services read them back with `fetch(uri)`, which works for both.
//
// Keep the presets and the cache header in step with the mobile app.

export type OptimizedMedia = {
  /** `blob:` URL of the optimized asset, ready to upload. */
  uri: string;
  mimeType: string;
  /** File extension without the dot, e.g. "jpg" / "mp4". */
  extension: string;
};

// Upload filenames are unique per file, so the content at a given URL never
// changes and can be cached for a year.
export const IMMUTABLE_CACHE_CONTROL = "31536000";

export type ImageOptimizePreset = {
  /** Cap on the longest edge in pixels. Smaller images are never upscaled. */
  maxEdge: number;
  /** JPEG quality, 0 (smallest) .. 1 (best). */
  compress: number;
};

export const IMAGE_PRESETS = {
  listingPhoto: { maxEdge: 1280, compress: 0.7 },
  chatImage: { maxEdge: 1280, compress: 0.7 },
  avatar: { maxEdge: 512, compress: 0.8 },
} satisfies Record<string, ImageOptimizePreset>;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/webm": "webm",
};

// When optimization fails we still upload the original rather than silently
// dropping the user's media — same rule as the app.
const fallbackMedia = async (
  uri: string,
  kind: "image" | "video",
): Promise<OptimizedMedia> => {
  let mimeType = kind === "video" ? "video/mp4" : "image/jpeg";

  try {
    const blob = await (await fetch(uri)).blob();
    if (blob.type) mimeType = blob.type;
  } catch {
    // Keep the default type; the upload itself will surface a real failure.
  }

  return {
    uri,
    mimeType,
    extension: EXTENSION_BY_MIME[mimeType] ?? (kind === "video" ? "mp4" : "jpg"),
  };
};

const canvasToJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      quality,
    );
  });

// iPhone photos are HEIC, which only Safari can decode. Detected by the file's
// own bytes ("ftyp" + heic/heix/mif1…) because browsers often report an empty
// type for them.
const isHeic = async (blob: Blob) => {
  if (/image\/hei[cf]/i.test(blob.type)) return true;
  const header = new TextDecoder().decode(await blob.slice(4, 12).arrayBuffer());
  return /^ftyp(heic|heix|hevc|hevx|mif1|msf1)/.test(header);
};

const decodeImage = async (source: Blob): Promise<ImageBitmap> => {
  try {
    // `from-image` applies EXIF orientation, so phone photos are not sideways.
    return await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch (error) {
    if (!(await isHeic(source))) throw error;
    // Loaded only for HEIC files: the converter is large.
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: source, toType: "image/jpeg", quality: 0.92 });
    const jpeg = Array.isArray(converted) ? converted[0] : converted;
    return createImageBitmap(jpeg, { imageOrientation: "from-image" });
  }
};

export const optimizeImage = async (
  uri: string,
  preset: ImageOptimizePreset,
): Promise<OptimizedMedia> => {
  try {
    const source = await (await fetch(uri)).blob();
    const bitmap = await decodeImage(source);

    // Never upscale: only shrink when the longest edge exceeds the cap.
    const scale = Math.min(1, preset.maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas unavailable");

    // JPEG has no alpha; paint white first so transparent PNGs don't go black.
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const output = await canvasToJpeg(canvas, preset.compress);

    return {
      uri: URL.createObjectURL(output),
      mimeType: "image/jpeg",
      extension: "jpg",
    };
  } catch (error) {
    console.warn("optimizeImage failed; falling back to original", error);
    return fallbackMedia(uri, "image");
  }
};

// Same target as the app (react-native-compressor there): longest edge capped
// at 1280, ~1.2 Mbps H.264 in an mp4 the iOS and Android players can stream.
// See the measurement notes in flatswipe's mediaOptimizer before changing it.
const VIDEO_MAX_SIZE = 1280;
const VIDEO_BITRATE = 1_200_000;
const AUDIO_BITRATE = 128_000;

/**
 * Re-encodes a video in the browser with Mediabunny (WebCodecs). Falls back to
 * the original — exactly like the app does in Expo Go — whenever the browser
 * cannot produce H.264 + AAC (e.g. Firefox has no AAC encoder): another codec
 * would play here but not in the iOS app. `onProgress` reports 0..1.
 */
export const optimizeVideo = async (
  uri: string,
  onProgress?: (fraction: number) => void,
): Promise<OptimizedMedia> => {
  try {
    const {
      ALL_FORMATS,
      BlobSource,
      BufferTarget,
      Conversion,
      Input,
      Mp4OutputFormat,
      Output,
      canEncodeAudio,
      canEncodeVideo,
    } = await import("mediabunny");

    if (!(await canEncodeVideo("avc")) || !(await canEncodeAudio("aac"))) {
      throw new Error("H.264/AAC encoding unavailable in this browser");
    }

    const source = await (await fetch(uri)).blob();
    const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(source) });
    const target = new BufferTarget();
    // Fast start puts the index first, so the players can start streaming
    // before the whole file has downloaded.
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target });

    const conversion = await Conversion.init({
      input,
      output,
      video: (track) => {
        const longest = Math.max(track.displayWidth, track.displayHeight);
        // Only ever downscale; the other side follows the aspect ratio.
        const resize =
          longest > VIDEO_MAX_SIZE
            ? track.displayWidth >= track.displayHeight
              ? { width: VIDEO_MAX_SIZE }
              : { height: VIDEO_MAX_SIZE }
            : {};
        return { ...resize, codec: "avc", bitrate: VIDEO_BITRATE, forceTranscode: true };
      },
      audio: { codec: "aac", bitrate: AUDIO_BITRATE },
    });

    if (!conversion.isValid) {
      throw new Error("Video cannot be converted in this browser");
    }

    conversion.onProgress = (progress) => onProgress?.(progress);
    await conversion.execute();

    if (!target.buffer) throw new Error("Conversion produced no output");
    const blob = new Blob([target.buffer], { type: "video/mp4" });

    // A short, already-efficient clip can come out bigger; keep the smaller.
    if (blob.size >= source.size && /mp4|quicktime/.test(source.type)) {
      return fallbackMedia(uri, "video");
    }

    return { uri: URL.createObjectURL(blob), mimeType: "video/mp4", extension: "mp4" };
  } catch (error) {
    console.warn("optimizeVideo unavailable; falling back to original", error);
    return fallbackMedia(uri, "video");
  }
};
