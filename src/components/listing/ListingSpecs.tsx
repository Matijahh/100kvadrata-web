"use client";

import BuildingIcon from "@assets/icons/building-icon.svg";
import CarIcon from "@assets/icons/car-icon.svg";
import CompassIcon from "@assets/icons/compass-icon.svg";
import EuroIcon from "@assets/icons/euro-icon.svg";
import ExpandIcon from "@assets/icons/expand-icon.svg";
import GridIcon from "@assets/icons/grid-icon.svg";
import HouseIcon from "@assets/icons/house-icon.svg";
import LayersIcon from "@assets/icons/layers-icon.svg";
import PinIcon from "@assets/icons/pin-icon.svg";
import StarIcon from "@assets/icons/star-icon-filled.svg";
import SuitcaseIcon from "@assets/icons/suitcase-icon.svg";
import { OpenInMapsMenu } from "@/components/listing/OpenInMapsMenu";
import { formatListingMetric } from "@/lib/listingFormat";
import type { Listing } from "@/types/types";
import { formatEuros, getListingTotalPrice } from "@/utils/listingPrice";
import { hasMappableAddress, listingMapAddress } from "@/utils/mapLinks";
import { useMemo, useState, type FC, type SVGProps } from "react";
import { useTranslation } from "react-i18next";

type Spec = { key: string; icon: FC<SVGProps<SVGSVGElement>>; label: string; value: string };

/**
 * The full description of a listing — location, specifications, heating,
 * extras, nearby, description — in the same sections and order as the app's
 * details overlay. Rendered inline on the listing page and in the desktop
 * reel's side panel.
 */
export function ListingSpecs({ listing }: { listing: Listing }) {
  const { t } = useTranslation();
  const [isMapOpen, setMapOpen] = useState(false);
  const mapAddress = useMemo(() => listingMapAddress(listing), [listing]);
  const canOpenInMaps = hasMappableAddress(mapAddress);
  const totalPrice = getListingTotalPrice(listing);

  const specs: Spec[] = [];
  const push = (condition: unknown, spec: Spec) => {
    if (condition) specs.push(spec);
  };

  push(totalPrice != null, {
    key: "price",
    icon: EuroIcon,
    label: t("listing.detailsPrice"),
    value: totalPrice != null ? formatEuros(totalPrice) : "",
  });
  push(listing.listing_type === "forSale" && listing.price_eur != null, {
    key: "pricePerSquare",
    icon: EuroIcon,
    label: t("listing.detailsPricePerSquare"),
    value: listing.price_eur != null ? formatEuros(listing.price_eur) : "",
  });
  push(listing.surface_m2 != null, {
    key: "surface",
    icon: ExpandIcon,
    label: t("listing.detailsSurface"),
    value: `${listing.surface_m2} m²`,
  });
  push(listing.rooms != null, {
    key: "rooms",
    icon: HouseIcon,
    label: t("listing.detailsRooms"),
    value: listing.rooms != null ? formatListingMetric(listing.rooms) : "",
  });
  push(listing.orientation, {
    key: "orientation",
    icon: CompassIcon,
    label: t("listing.detailsOrientation"),
    value: t(`newListing.orientations.${listing.orientation}`),
  });
  push(listing.construction_type, {
    key: "construction",
    icon: BuildingIcon,
    label: t("listing.detailsConstructionType"),
    value: t(`newListing.constructionTypeOptions.${listing.construction_type}`),
  });
  push(listing.property_condition, {
    key: "condition",
    icon: StarIcon,
    label: t("listing.detailsPropertyCondition"),
    value: t(`newListing.propertyConditionOptions.${listing.property_condition}`),
  });
  push(listing.storey, {
    key: "storey",
    icon: LayersIcon,
    label: t("listing.detailsFloor"),
    // 'floor' is the "type the number" option, so the number is the answer.
    value:
      listing.storey === "floor" && listing.storey_floor_number != null
        ? String(listing.storey_floor_number)
        : t(`newListing.storeyOptions.${listing.storey}`),
  });
  push(listing.ground_type, {
    key: "ground",
    icon: GridIcon,
    label: t("listing.detailsGround"),
    value:
      listing.ground_type === "other" && listing.ground_other
        ? listing.ground_other
        : t(`newListing.groundOptions.${listing.ground_type}`),
  });
  push(listing.furniture, {
    key: "furniture",
    icon: SuitcaseIcon,
    label: t("listing.detailsFurniture"),
    value: t(`newListing.furnitureOptions.${listing.furniture}`),
  });
  push(listing.parking, {
    key: "parking",
    icon: CarIcon,
    label: t("listing.detailsParking"),
    value: t(`newListing.parkingOptions.${listing.parking}`),
  });

  const chipSections = [
    {
      key: "heating",
      title: t("listing.detailsHeatingTitle"),
      items: (listing.heating_types ?? []).map((value) => t(`newListing.heatingOptions.${value}`)),
    },
    {
      key: "additional",
      title: t("listing.detailsAdditional"),
      items: (listing.additional_features ?? []).map((value) =>
        t(`newListing.additionalFeatureOptions.${value}`),
      ),
    },
    {
      key: "nearby",
      title: t("listing.detailsNearby"),
      items: (listing.nearby_objects ?? []).map((value) =>
        t(`newListing.nearbyObjectOptions.${value}`),
      ),
    },
  ].filter((section) => section.items.length > 0);

  const hasLocation = listing.city || listing.municipality || listing.street;

  return (
    <div className="flex flex-col gap-6">
      {hasLocation ? (
        <Section title={t("listing.detailsLocation")}>
          {listing.street ? (
            <p className="text-[17px] text-text">
              {[listing.street, listing.street_number].filter(Boolean).join(" ")}
            </p>
          ) : null}
          {listing.city ? <p className="text-[17px] text-text">{listing.city}</p> : null}
          {listing.municipality ? <p className="text-[17px] text-text">{listing.municipality}</p> : null}
          {canOpenInMaps ? (
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="mt-3 inline-flex items-center gap-2 self-start rounded-[22px] border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              <PinIcon width={13} height={15} aria-hidden />
              {t("listing.detailsOpenInMaps")}
            </button>
          ) : null}
        </Section>
      ) : null}

      {specs.length > 0 ? (
        <Section title={t("listing.detailsSpecs")}>
          <dl className="grid gap-x-6 sm:grid-cols-2">
            {specs.map(({ key, icon: Icon, label, value }) => (
              <div key={key} className="flex items-center gap-2.5 border-b border-divider py-3">
                <Icon width={16} height={16} className="shrink-0 text-text-muted" aria-hidden />
                <dt className="flex-1 text-base text-text-muted">{label}</dt>
                <dd className="text-right text-base font-semibold text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      {chipSections.map((section) => (
        <Section key={section.key} title={section.title}>
          <ul className="flex flex-wrap gap-2">
            {section.items.map((item) => (
              <li key={item} className="rounded-full bg-surface-muted px-3.5 py-1.5 text-[15px] text-text">
                {item}
              </li>
            ))}
          </ul>
        </Section>
      ))}

      {listing.description ? (
        <Section title={t("listing.detailsDescription")}>
          <p className="whitespace-pre-line text-[17px] leading-relaxed text-text">{listing.description}</p>
        </Section>
      ) : null}

      {canOpenInMaps ? (
        <OpenInMapsMenu open={isMapOpen} onOpenChange={setMapOpen} address={mapAddress} />
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      {children}
    </section>
  );
}
