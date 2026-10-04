"use client";

import { FloorNumberInput } from "@/components/form/FloorNumberInput";
import { LabeledAutocompleteField } from "@/components/form/LabeledAutocompleteField";
import { LabeledMultiSelectField } from "@/components/form/LabeledMultiSelectField";
import { LabeledRadioField } from "@/components/form/LabeledRadioField";
import { LabeledSelectField } from "@/components/form/LabeledSelectField";
import { PillInput } from "@/components/form/PillInput";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import {
  DEFAULT_COUNTRY_CODE,
  searchCities,
  searchMunicipalities,
  type CitySuggestion,
} from "@/services/locations";
import {
  LISTING_ADDITIONAL_FEATURE_VALUES,
  LISTING_CATEGORY_VALUES,
  LISTING_CONSTRUCTION_TYPE_VALUES,
  LISTING_FURNITURE_VALUES,
  LISTING_GROUND_VALUES,
  LISTING_HEATING_VALUES,
  LISTING_NEARBY_OBJECT_VALUES,
  LISTING_ORIENTATION_VALUES,
  LISTING_PARKING_VALUES,
  LISTING_PROPERTY_CONDITION_VALUES,
  LISTING_STOREY_VALUES,
  LISTING_TYPE_VALUES,
  type ListingAdditionalFeature,
  type ListingCategory,
  type ListingConstructionType,
  type ListingFurniture,
  type ListingGround,
  type ListingHeating,
  type ListingNearbyObject,
  type ListingOrientation,
  type ListingParking,
  type ListingPropertyCondition,
  type ListingStorey,
  type ListingType,
} from "@/types/types";
import { normalizeLocationText } from "@/utils/locationText";
import { sanitizeDecimalInput, sanitizeIntegerInput } from "@/utils/numericInput";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * The criteria every "describe a property" form shares — ListingFilters,
 * BuyerFilters and PreferenceCriteria all carry these keys under the same
 * names, which is why the app's three forms (HomeFilterSheet,
 * BuyersFilterSheet, preferences/[id]) are near copies of each other. On the
 * web they are one component.
 */
export type CriteriaValues = {
  category?: ListingCategory | null;
  listingType?: ListingType | null;
  city?: string | null;
  municipality?: string | null;
  minSurfaceM2?: number | null;
  maxSurfaceM2?: number | null;
  minRooms?: number | null;
  maxRooms?: number | null;
  minPriceEur?: number | null;
  maxPriceEur?: number | null;
  orientation?: ListingOrientation[];
  parking?: ListingParking[];
  constructionType?: ListingConstructionType[];
  propertyCondition?: ListingPropertyCondition[];
  storey?: ListingStorey[];
  storeyFloorNumber?: number | null;
  heatingTypes?: ListingHeating[];
  groundType?: ListingGround[];
  furniture?: ListingFurniture[];
  nearbyObjects?: ListingNearbyObject[];
  additionalFeatures?: ListingAdditionalFeature[];
};

type NumberKey =
  | "minSurfaceM2"
  | "maxSurfaceM2"
  | "minRooms"
  | "maxRooms"
  | "storeyFloorNumber"
  | "minPriceEur"
  | "maxPriceEur";

export function CriteriaFields<T extends CriteriaValues>({
  value,
  onChange,
  columns = 2,
  stacked = false,
}: {
  value: T;
  onChange: (next: T) => void;
  /** 2 from `md` up (full-page forms); 1 for the feed's filters. */
  columns?: 1 | 2;
  /** Pairs (min/max, rent/sale) one under the other — the narrow desktop panel. */
  stacked?: boolean;
}) {
  const { t } = useTranslation();
  const grid = cn("grid gap-x-4", columns === 2 && "md:grid-cols-2");

  // Cleared text becomes null rather than "": a saved preference set needs an
  // explicit null to clear the column, and the filter normalisers drop nulls.
  const set = <K extends keyof CriteriaValues>(key: K, next: CriteriaValues[K]) =>
    onChange({ ...value, [key]: next });

  const setNumber = (key: NumberKey, next: number | null) => set(key, next);

  // The floor number belongs to the "floor" storey and leaves with it, so it
  // cannot linger and narrow results from an input no longer on screen.
  const setStorey = (values: ListingStorey[]) =>
    onChange({
      ...value,
      storey: values,
      ...(values.includes("floor") ? null : { storeyFloorNumber: null }),
    });

  const options = useMemo(() => {
    const optionsFor = <V extends string>(values: readonly V[], key: string) =>
      values.map((option) => ({ label: t(`newListing.${key}.${option}`), value: option }));

    return {
      listingType: optionsFor(LISTING_TYPE_VALUES, "listingTypes") as [
        { label: string; value: ListingType },
        { label: string; value: ListingType },
      ],
      category: optionsFor(LISTING_CATEGORY_VALUES, "categories"),
      orientation: optionsFor(LISTING_ORIENTATION_VALUES, "orientations"),
      parking: optionsFor(LISTING_PARKING_VALUES, "parkingOptions"),
      furniture: optionsFor(LISTING_FURNITURE_VALUES, "furnitureOptions"),
      constructionType: optionsFor(LISTING_CONSTRUCTION_TYPE_VALUES, "constructionTypeOptions"),
      propertyCondition: optionsFor(LISTING_PROPERTY_CONDITION_VALUES, "propertyConditionOptions"),
      storey: optionsFor(LISTING_STOREY_VALUES, "storeyOptions"),
      heating: optionsFor(LISTING_HEATING_VALUES, "heatingOptions"),
      ground: optionsFor(LISTING_GROUND_VALUES, "groundOptions"),
      nearbyObjects: optionsFor(LISTING_NEARBY_OBJECT_VALUES, "nearbyObjectOptions"),
      additionalFeatures: optionsFor(LISTING_ADDITIONAL_FEATURE_VALUES, "additionalFeatureOptions"),
    };
  }, [t]);

  const priceHintKey =
    value.listingType === "forSale"
      ? "feed.filterForm.pricePerSquare"
      : value.listingType === "forRent"
        ? "feed.filterForm.pricePerMonth"
        : "feed.filterForm.price";

  return (
    <div>
      <div className={grid}>
        <LabeledSelectField
          label={t("newListing.categoryLabel")}
          placeholder={t("newListing.categoryPlaceholder")}
          options={options.category}
          value={value.category ?? null}
          onChange={(next) => set("category", next)}
          allowEmpty
        />
        <LabeledRadioField
          label={t("feed.filterForm.listingTypeLabel")}
          options={options.listingType}
          value={value.listingType ?? null}
          onChange={(next) => set("listingType", next)}
          allowEmpty
          stacked={stacked}
        />
      </div>

      <SectionTitle>{t("feed.filterForm.locationTitle")}</SectionTitle>
      <div className={grid}>
        <LabeledAutocompleteField<CitySuggestion>
          placeholder={t("feed.filterForm.cityPlaceholder")}
          value={value.city ?? ""}
          onChangeText={(next) => set("city", next || null)}
          fetchSuggestions={(query) => searchCities(query)}
          queryKey={(query) => queryKeys.citySearch(DEFAULT_COUNTRY_CODE, normalizeLocationText(query))}
          getItemLabel={(suggestion) => suggestion.city}
          getItemDescription={(suggestion) => suggestion.municipality}
        />
        <LabeledAutocompleteField<string>
          placeholder={t("feed.filterForm.municipalityPlaceholder")}
          value={value.municipality ?? ""}
          onChangeText={(next) => set("municipality", next || null)}
          fetchSuggestions={(query) => searchMunicipalities(query, { city: value.city || null })}
          queryKey={(query) =>
            queryKeys.municipalitySearch(
              DEFAULT_COUNTRY_CODE,
              value.city ?? "",
              normalizeLocationText(query),
            )
          }
          getItemLabel={(name) => name}
        />
      </div>

      <SectionTitle>{t("feed.filterForm.priceAndSurfaceTitle")}</SectionTitle>
      <div className={cn(grid, "gap-y-0")}>
        <RangeRow
          stacked={stacked}
          minValue={value.minPriceEur}
          maxValue={value.maxPriceEur}
          minPlaceholder={t("feed.filterForm.minPricePlaceholder")}
          maxPlaceholder={t("feed.filterForm.maxPricePlaceholder")}
          onMinChange={(next) => setNumber("minPriceEur", next)}
          onMaxChange={(next) => setNumber("maxPriceEur", next)}
          hint={t(priceHintKey)}
        />
        <RangeRow
          stacked={stacked}
          minValue={value.minSurfaceM2}
          maxValue={value.maxSurfaceM2}
          minPlaceholder={t("feed.filterForm.minSurfacePlaceholder")}
          maxPlaceholder={t("feed.filterForm.maxSurfacePlaceholder")}
          onMinChange={(next) => setNumber("minSurfaceM2", next)}
          onMaxChange={(next) => setNumber("maxSurfaceM2", next)}
        />
      </div>

      <SectionTitle>{t("feed.filterForm.roomsLabel")}</SectionTitle>
      <div className={cn(columns === 2 && "md:max-w-[calc(50%-8px)]")}>
        <RangeRow
          stacked={stacked}
          minValue={value.minRooms}
          maxValue={value.maxRooms}
          minPlaceholder={t("feed.filterForm.minRoomsPlaceholder")}
          maxPlaceholder={t("feed.filterForm.maxRoomsPlaceholder")}
          onMinChange={(next) => setNumber("minRooms", next)}
          onMaxChange={(next) => setNumber("maxRooms", next)}
          decimal
        />
      </div>

      <SectionTitle>{t("feed.filterForm.featuresTitle")}</SectionTitle>
      {/* Every one of these is multi-select: alternatives, not requirements
          (except features and nearby objects, which the services match as
          "has all of"). */}
      <div className={grid}>
        <LabeledMultiSelectField
          label={t("newListing.orientationLabel")}
          placeholder={t("newListing.orientationPlaceholder")}
          options={options.orientation}
          values={value.orientation ?? []}
          onChange={(next) => set("orientation", next)}
        />
        <LabeledMultiSelectField
          label={t("feed.filterForm.parkingLabel")}
          placeholder={t("feed.filterForm.parkingPlaceholder")}
          options={options.parking}
          values={value.parking ?? []}
          onChange={(next) => set("parking", next)}
        />
        <LabeledMultiSelectField
          label={t("feed.filterForm.furnitureLabel")}
          placeholder={t("feed.filterForm.furniturePlaceholder")}
          options={options.furniture}
          values={value.furniture ?? []}
          onChange={(next) => set("furniture", next)}
        />
        <LabeledMultiSelectField
          label={t("newListing.constructionTypeLabel")}
          placeholder={t("newListing.constructionTypePlaceholder")}
          options={options.constructionType}
          values={value.constructionType ?? []}
          onChange={(next) => set("constructionType", next)}
        />
        <LabeledMultiSelectField
          label={t("newListing.propertyConditionLabel")}
          placeholder={t("newListing.propertyConditionPlaceholder")}
          options={options.propertyCondition}
          values={value.propertyCondition ?? []}
          onChange={(next) => set("propertyCondition", next)}
        />
        <LabeledMultiSelectField
          label={t("newListing.storeyLabel")}
          placeholder={t("newListing.storeyPlaceholder")}
          options={options.storey}
          values={value.storey ?? []}
          onChange={setStorey}
          renderOptionDetail={(option) =>
            option === "floor" ? (
              <FloorNumberInput
                value={value.storeyFloorNumber}
                onChange={(next) => setNumber("storeyFloorNumber", parseNumber(sanitizeIntegerInput(next)))}
              />
            ) : null
          }
          getSelectedLabel={(option) =>
            option === "floor" && value.storeyFloorNumber != null
              ? t("feed.filterSummary.floorNumber", { value: value.storeyFloorNumber })
              : null
          }
        />
        <LabeledMultiSelectField
          label={t("newListing.heatingLabel")}
          placeholder={t("newListing.heatingPlaceholder")}
          options={options.heating}
          values={value.heatingTypes ?? []}
          onChange={(next) => set("heatingTypes", next)}
        />
        <LabeledMultiSelectField
          label={t("newListing.groundLabel")}
          placeholder={t("newListing.groundPlaceholder")}
          options={options.ground}
          values={value.groundType ?? []}
          onChange={(next) => set("groundType", next)}
        />
        <LabeledMultiSelectField
          label={t("feed.filterForm.nearbyObjectsLabel")}
          placeholder={t("feed.filterForm.nearbyObjectsPlaceholder")}
          options={options.nearbyObjects}
          values={value.nearbyObjects ?? []}
          onChange={(next) => set("nearbyObjects", next)}
        />
        <LabeledMultiSelectField
          label={t("newListing.additionalFeaturesLabel")}
          placeholder={t("newListing.additionalFeaturesPlaceholder")}
          options={options.additionalFeatures}
          values={value.additionalFeatures ?? []}
          onChange={(next) => set("additionalFeatures", next)}
        />
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2.5 mt-2 font-display text-base text-text">{children}</h2>;
}

function RangeRow({
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  onMinChange,
  onMaxChange,
  hint,
  decimal = false,
  stacked = false,
}: {
  minValue?: number | null;
  maxValue?: number | null;
  minPlaceholder: string;
  maxPlaceholder: string;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  hint?: string;
  decimal?: boolean;
  stacked?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className={cn("flex gap-3", stacked && "flex-col")}>
        <NumberPill value={minValue} onChange={onMinChange} placeholder={minPlaceholder} decimal={decimal} />
        <NumberPill value={maxValue} onChange={onMaxChange} placeholder={maxPlaceholder} decimal={decimal} />
      </div>
      {hint ? <p className="mt-1.5 text-[13px] font-light text-text-muted">{hint}</p> : null}
    </div>
  );
}

const parseNumber = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value?: number | null) => (value == null ? "" : String(value));

/**
 * A number field that keeps what was typed. Bound straight to the number,
 * "2." would collapse to "2" mid-keystroke and a half room could never be
 * entered; here the text is local and only re-synced when the value changes
 * from outside (Clear all, a saved search being applied).
 */
function NumberPill({
  value,
  onChange,
  placeholder,
  decimal,
}: {
  value?: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
  decimal: boolean;
}) {
  const [text, setText] = useState(formatNumber(value));

  useEffect(() => {
    setText((current) => (parseNumber(current) === (value ?? null) ? current : formatNumber(value)));
  }, [value]);

  return (
    <PillInput
      value={text}
      onChangeText={(raw) => {
        const next = decimal ? sanitizeDecimalInput(raw) : sanitizeIntegerInput(raw);
        setText(next);
        onChange(parseNumber(next));
      }}
      placeholder={placeholder}
      aria-label={placeholder}
      inputMode={decimal ? "decimal" : "numeric"}
    />
  );
}
