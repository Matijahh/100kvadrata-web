"use client";

import CopyIcon from "@assets/icons/copy-icon.svg";
import PinIcon from "@assets/icons/pin-icon.svg";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";
import {
  MapAddress,
  buildAppleMapsUrl,
  buildGoogleMapsUrl,
  buildMapAddress,
} from "@/utils/mapLinks";
import { useTranslation } from "react-i18next";

// Web counterpart of the app's OpenInMapsSheet: the address spelled out, then
// Google Maps, Apple Maps (Apple devices only) and copy. The https map URLs
// open the installed map app on phones and the web map on desktop.
export function OpenInMapsMenu({
  open,
  onOpenChange,
  address,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: MapAddress;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const addressText = buildMapAddress(address);
  const isAppleDevice =
    typeof navigator !== "undefined" && /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent);

  const openUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  const copy = async () => {
    onOpenChange(false);
    try {
      await navigator.clipboard.writeText(addressText);
      showToast({ type: "success", message: t("listing.mapsAddressCopied") });
    } catch {
      showToast({ type: "error", message: t("listing.mapsCopyFailed") });
    }
  };

  const options = [
    { key: "google", label: t("listing.mapsGoogle"), icon: PinIcon, onClick: () => openUrl(buildGoogleMapsUrl(address)) },
    ...(isAppleDevice
      ? [{ key: "apple", label: t("listing.mapsApple"), icon: PinIcon, onClick: () => openUrl(buildAppleMapsUrl(address)) }]
      : []),
    { key: "copy", label: t("listing.mapsCopyAddress"), icon: CopyIcon, onClick: copy },
  ];

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={t("listing.mapsSheetTitle")} description={addressText}>
      <div className="mt-5 flex flex-col gap-2.5">
        {options.map(({ key, label, icon: Icon, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className="flex min-h-[54px] items-center gap-3 rounded-[20px] bg-surface-muted px-4 text-left text-base text-text hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-primary">
              <Icon width={18} height={18} aria-hidden />
            </span>
            {label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
