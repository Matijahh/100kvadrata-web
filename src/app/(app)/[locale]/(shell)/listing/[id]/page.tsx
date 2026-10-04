import { getServerT } from "@/i18n/server";
import { SITE_ORIGIN } from "@/content/common";
import { getListingAddressLabel, isListingExpired, splitListingMedia } from "@/lib/listingFormat";
import { buildListingUrl } from "@/lib/shareListing";
import { fetchListingById } from "@/services/listings";
import type { AppLanguage, Listing } from "@/types/types";
import { getListingPriceLabel, getListingTotalPrice } from "@/utils/listingPrice";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ListingView } from "./ListingView";

// The public page behind every shared link (https://100-kvadrata.rs/listing/:id).
// On a phone with the app installed, iOS / Android open the app instead (app
// links); everyone else gets this page, rendered on the server so link previews
// in Viber / WhatsApp show the photo and price, and search engines can index it.

type PageProps = { params: Promise<{ locale: string; id: string }> };

// generateMetadata and the page both need the listing; cache() makes it one
// query per request. Runs through the shared service on the server's anonymous
// Supabase client, so RLS decides exactly what a logged-out visitor may see.
const getListing = cache(async (id: string): Promise<Listing | null> => {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  try {
    return await fetchListingById(id);
  } catch (error) {
    // .single() reports "no row" as PGRST116 — that is a 404, anything else is
    // a real failure and should surface as one.
    if ((error as { code?: string })?.code === "PGRST116") {
      return null;
    }
    throw error;
  }
});

const listingTitle = (listing: Listing, t: ReturnType<typeof getServerT>) => {
  const category = listing.category ? t(`newListing.categories.${listing.category}`) : null;
  const surface = listing.surface_m2 != null ? `${listing.surface_m2} m²` : null;
  const place = listing.municipality || listing.city;
  const price = getListingPriceLabel(listing, t);

  return [[category, surface].filter(Boolean).join(" "), place, price].filter(Boolean).join(" · ");
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const listing = await getListing(id);
  const t = getServerT(locale as AppLanguage);

  if (!listing) {
    return { title: t("web.listing.notFoundTitle"), robots: { index: false } };
  }

  const title = listingTitle(listing, t) || t("listing.title");
  const description =
    listing.description?.replace(/\s+/g, " ").trim().slice(0, 180) ||
    getListingAddressLabel(listing) ||
    undefined;
  const { photos } = splitListingMedia(listing);
  const path = `/listing/${listing.id}`;

  return {
    title,
    description,
    // Expired listings stay reachable for anyone holding the link, but drop
    // out of search results.
    robots: isListingExpired(listing) ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: locale === "en" ? `/en${path}` : path,
      languages: { sr: path, en: `/en${path}` },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: buildListingUrl(listing.id),
      locale: locale === "en" ? "en_US" : "sr_RS",
      images: photos[0] ? [{ url: photos[0].public_url }] : ["/favicon.png"],
    },
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { locale, id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    notFound();
  }

  const t = getServerT(locale as AppLanguage);
  const total = getListingTotalPrice(listing);
  const price = listing.listing_type === "forSale" ? total : listing.price_eur;
  const { photos } = splitListingMedia(listing);

  // schema.org structured data so search engines understand price and place.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listingTitle(listing, t),
    url: `${SITE_ORIGIN}/listing/${listing.id}`,
    datePosted: listing.created_at,
    image: photos.map((photo) => photo.public_url).slice(0, 5),
    description: listing.description ?? undefined,
    ...(price != null
      ? {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "EUR",
            businessFunction:
              listing.listing_type === "forRent"
                ? "http://purl.org/goodrelations/v1#LeaseOut"
                : "http://purl.org/goodrelations/v1#Sell",
          },
        }
      : {}),
    ...(listing.city
      ? {
          contentLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: listing.city,
              addressRegion: listing.municipality ?? undefined,
              streetAddress: listing.street ?? undefined,
              addressCountry: "RS",
            },
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped, so a description cannot close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ListingView initialListing={listing} />
    </>
  );
}
