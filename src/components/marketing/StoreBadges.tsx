import GlobeIcon from "@assets/icons/globe-icon.svg";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/content/common";

/* The official App Store / Google Play badges. Both images are cropped to
   the visible badge, so equal heights line them up per the store guidelines.
   `webApp` adds a third, badge-shaped button into the web version. */
export function StoreBadges({
  labels,
  webApp,
  className,
}: {
  labels: { appStore: string; googlePlay: string };
  webApp?: { href: string; label: string };
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
      {webApp ? (
        // Same tab: it is our own app (a full page load into it).
        <a className="store store--web" href={webApp.href}>
          <GlobeIcon width={22} height={22} aria-hidden="true" />
          <span>{webApp.label}</span>
        </a>
      ) : null}
    </div>
  );
}
