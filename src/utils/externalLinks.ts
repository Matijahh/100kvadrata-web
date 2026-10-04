// Platform adapter — same exports as flatswipe/src/utils/externalLinks.ts,
// backed by the browser instead of React Native's `Linking`.

export const normalizeExternalUrl = (url: string) => {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
};

/** Opens the dialer (or the desktop's tel: handler). */
export const openPhoneNumber = async (phone: string) => {
  const trimmed = phone.trim();
  const leadingPlus = trimmed.startsWith("+") ? "+" : "";
  const dialable = `${leadingPlus}${trimmed.replace(/\D/g, "")}`;

  if (!leadingPlus && !dialable) {
    return;
  }

  window.location.href = `tel:${dialable}`;
};

export const openExternalUrl = async (url: string) => {
  const normalizedUrl = normalizeExternalUrl(url);

  if (!normalizedUrl) {
    return;
  }

  window.open(normalizedUrl, "_blank", "noopener,noreferrer");
};

/** Opens a URL as-is (no https:// prefixing), e.g. a maps link. */
export const openUrlDirectly = async (url: string) => {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return;
  }

  window.open(trimmedUrl, "_blank", "noopener,noreferrer");
};
