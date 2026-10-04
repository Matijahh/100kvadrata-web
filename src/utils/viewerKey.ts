// Platform adapter — same export as flatswipe/src/utils/viewerKey.ts, stored
// in localStorage instead of AsyncStorage.

const VIEWER_KEY_STORAGE_KEY = "100m2.viewerKey";

let cachedViewerKey: string | null = null;

const createViewerKey = () =>
  `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;

/**
 * A stable per-browser id used to tell guests apart when counting listing
 * views. Signed-in viewers never rely on it — the database keys them on their
 * user id. Resolves to null when storage is unavailable (private mode, blocked
 * site data), in which case the view simply goes uncounted.
 */
export const getViewerKey = async (): Promise<string | null> => {
  if (cachedViewerKey) {
    return cachedViewerKey;
  }

  try {
    const storedKey = window.localStorage.getItem(VIEWER_KEY_STORAGE_KEY);

    if (storedKey) {
      cachedViewerKey = storedKey;
      return storedKey;
    }

    const newKey = createViewerKey();
    window.localStorage.setItem(VIEWER_KEY_STORAGE_KEY, newKey);
    cachedViewerKey = newKey;

    return newKey;
  } catch {
    return null;
  }
};
