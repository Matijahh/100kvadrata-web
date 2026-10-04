// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import type { Listing } from "@/types/types";

export type MapAddress = {
  street?: string | null;
  streetNumber?: number | string | null;
  city?: string | null;
  municipality?: string | null;
  country?: string | null;
};

/**
 * `state` on a listing holds a country *name* ("Srbija"), not a region — it is
 * populated from the countries table, so it belongs in the country slot.
 */
export const listingMapAddress = (listing: Listing): MapAddress => ({
  street: listing.street,
  streetNumber: listing.street_number,
  city: listing.city,
  municipality: listing.municipality,
  country: listing.state,
});

/**
 * A single-line address for a map app's geocoder.
 *
 * The municipality is only used when there is no city: on "Knez Mihailova 5,
 * Beograd" the opština is noise that can pull the pin off the street, but on an
 * older listing that never got a city it is the only locality we have.
 */
export const buildMapAddress = (address: MapAddress) => {
  const street = address.street?.trim();
  const streetNumber =
    address.streetNumber != null ? String(address.streetNumber).trim() : "";
  const locality = address.city?.trim() || address.municipality?.trim();
  const country = address.country?.trim();

  // A house number without a street name is not a place — searching "5, Beograd"
  // drops the pin somewhere arbitrary, so the number only rides along.
  const streetPart = street ? [street, streetNumber].filter(Boolean).join(" ") : "";

  return [streetPart, locality, country].filter(Boolean).join(", ");
};

/**
 * A country on its own would drop the pin in the middle of Serbia, so it does
 * not count as something worth offering to open.
 */
export const hasMappableAddress = (address: MapAddress) =>
  buildMapAddress({ ...address, country: null }).length > 0;

/**
 * The iOS builders return plain https URLs rather than the `maps://` and
 * `comgooglemaps://` schemes on purpose. iOS only reports a custom scheme as
 * openable when it is declared in `LSApplicationQueriesSchemes`, which would
 * mean an Info.plist entry and a rebuild. These https forms are claimed by the
 * same universal links, so they open the installed app just as directly, and
 * they fall back to the web map instead of failing when it is missing.
 */
export const buildAppleMapsUrl = (address: MapAddress) =>
  `https://maps.apple.com/?q=${encodeURIComponent(buildMapAddress(address))}`;

export const buildGoogleMapsUrl = (address: MapAddress) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    buildMapAddress(address),
  )}`;

/**
 * Android's own map link. The reasoning above does not carry over: an https
 * Google Maps URL only reaches the Maps app when the user has link handling
 * turned on for it, and otherwise opens a browser tab showing a map — which
 * is what "the location does not open" looks like from the outside.
 *
 * `geo:` is the platform's map intent. It goes to whichever map apps are
 * installed, so it works for someone who uses something other than Google
 * Maps, and it fails cleanly into the error toast when there is no map app
 * at all.
 *
 * The `0,0` is a placeholder: with a `q=` search term the coordinates are
 * ignored, and this is the documented form for handing over an address rather
 * than a point.
 */
export const buildGeoUrl = (address: MapAddress) =>
  `geo:0,0?q=${encodeURIComponent(buildMapAddress(address))}`;
