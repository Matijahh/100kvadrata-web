import { supabase } from "@/lib/supabase";
import { IMMUTABLE_CACHE_CONTROL } from "@/utils/mediaOptimizer";

// Platform adapter — the mobile app posts a native file URI through the Storage
// REST endpoint. Here the URI is a `blob:` URL from the media optimizer, so the
// bytes are read back into a Blob and uploaded through the JS client.

type UploadLocalFileInput = {
  bucket: string;
  /** Object path inside the bucket. */
  path: string;
  /** `blob:` (or any fetchable) URL of the already optimized asset. */
  uri: string;
  contentType: string;
};

export const uploadLocalFile = async ({
  bucket,
  path,
  uri,
  contentType,
}: UploadLocalFileInput): Promise<void> => {
  const blob = await (await fetch(uri)).blob();

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType,
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  });

  if (error) throw error;
};
