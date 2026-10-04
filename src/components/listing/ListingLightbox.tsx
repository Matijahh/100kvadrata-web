"use client";

import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/styles.css";

// Full-screen photo viewer with zoom — the web's stand-in for the app's pinch
// to zoom. Loaded on demand (next/dynamic) the first time a photo is opened, so
// the library never weighs on the listing page itself.
export default function ListingLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  photos: { src: string; alt: string }[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  return (
    <Lightbox
      open
      close={onClose}
      index={index}
      slides={photos}
      plugins={[Zoom, Counter]}
      on={{ view: ({ index: next }) => onIndexChange(next) }}
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
      controller={{ closeOnBackdropClick: true }}
      carousel={{ finite: photos.length <= 1 }}
      render={
        photos.length <= 1 ? { buttonPrev: () => null, buttonNext: () => null } : undefined
      }
    />
  );
}
