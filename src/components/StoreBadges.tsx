import { APP_STORE_URL, PLAY_STORE_URL } from "@/content/common";

/* The official App Store / Google Play badges. Both images are cropped to
   the visible badge, so equal heights line them up per the store guidelines. */
export function StoreBadges({
  labels,
  className,
}: {
  labels: { appStore: string; googlePlay: string };
  className?: string;
}) {
  return (
    <div className={className ? `stores ${className}` : "stores"}>
      <a className="store" href={APP_STORE_URL} target="_blank" rel="noopener">
        <img
          src="/badges/app-store.svg"
          alt={labels.appStore}
          width={144}
          height={48}
          decoding="async"
        />
      </a>
      <a className="store" href={PLAY_STORE_URL} target="_blank" rel="noopener">
        <img
          src="/badges/google-play.png"
          alt={labels.googlePlay}
          width={160}
          height={48}
          decoding="async"
        />
      </a>
    </div>
  );
}
