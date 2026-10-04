import { NextResponse, type NextRequest } from "next/server";
import { APP_STORE_URL, PLAY_STORE_URL, SITE_ORIGIN } from "@/content/common";

// Target of the QR code on desktop: sends a phone to its own store, anything
// else to the landing page (which shows both badges).
export function GET(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";

  if (/android/i.test(userAgent)) {
    return NextResponse.redirect(PLAY_STORE_URL);
  }

  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return NextResponse.redirect(APP_STORE_URL);
  }

  return NextResponse.redirect(SITE_ORIGIN);
}
