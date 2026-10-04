import { SITE_ORIGIN } from "@/content/common";
import { getServerT } from "@/i18n/server";
import type { AppLanguage } from "@/types/types";
import QRCode from "qrcode";

// Small "get the app" card for the desktop nav rail. The QR points at
// /get-app, which sends phones to their store, so one code serves iOS and
// Android. Rendered on the server; no QR library reaches the browser.
export async function GetAppCard({ locale }: { locale: AppLanguage }) {
  const t = getServerT(locale);
  const svg = await QRCode.toString(`${SITE_ORIGIN}/get-app`, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#161722", light: "#FFFFFF" },
  });

  return (
    <div className="flex w-[80px] flex-col items-center gap-1.5 rounded-2xl bg-surface-muted p-2 text-center">
      <div
        className="w-full rounded-lg bg-white p-1.5"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="text-[10px] font-semibold leading-tight text-text">
        {t("web.getApp.cardTitle")}
      </p>
      <p className="text-[9px] leading-tight text-text-muted">{t("web.getApp.cardMessage")}</p>
    </div>
  );
}
