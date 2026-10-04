"use client";

import { LabeledAutocompleteField } from "@/components/form/LabeledAutocompleteField";
import { LabeledMultiSelectField } from "@/components/form/LabeledMultiSelectField";
import { LabeledRadioField } from "@/components/form/LabeledRadioField";
import { LabeledSelectField } from "@/components/form/LabeledSelectField";
import { LabeledTextField } from "@/components/form/LabeledTextField";
import { queryKeys } from "@/lib/queryKeys";
import {
  type CitySuggestion,
  DEFAULT_COUNTRY_CODE,
  fetchActiveCountries,
  searchCities,
  searchMunicipalities,
  searchStreets,
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
  type ListingType,
  type NewListingDraft,
} from "@/types/types";
import { formatEuros, getListingTotalPrice } from "@/utils/listingPrice";
import { normalizeLocationText } from "@/utils/locationText";
import { sanitizeDecimalInput, sanitizeIntegerInput } from "@/utils/numericInput";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useMemo } from "react";
import { useTranslation } from "react-i18next";

type DraftChange = <Key extends keyof NewListingDraft>(key: Key, value: NewListingDraft[Key]) => void;

/**
 * The listing's details — web port of flatswipe/src/components/newListing/
 * NewListingStepOne.tsx with the same fields, order and input rules, laid out
 * in two columns on desktop and grouped into sections.
 */
export function ListingDetailsForm({
  draft,
  onDraftChange,
}: {
  draft: NewListingDraft;
  onDraftChange: DraftChange;
}) {
  const { t } = useTranslation();
  const descriptionId = useId();

  const { data: countries } = useQuery({
    queryKey: queryKeys.activeCountries,
    queryFn: fetchActiveCountries,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // The country is stored but not asked (one option is no question) — filled
  // in silently, falling back to Serbia, like the app.
  useEffect(() => {
    if (!draft.state) {
      onDraftChange("state", countries?.[0]?.name ?? "Srbija");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  const options = useMemo(() => {
    const of = <T extends string>(values: readonly T[], key: string) =>
      values.map((value) => ({ value, label: t(`newListing.${key}.${value}`) }));
    return {
      category: of(LISTING_CATEGORY_VALUES, "categories"),
      listingType: of(LISTING_TYPE_VALUES, "listingTypes") as [
        { value: ListingType; label: string },
        { value: ListingType; label: string },
      ],
      orientation: of(LISTING_ORIENTATION_VALUES, "orientations"),
      parking: of(LISTING_PARKING_VALUES, "parkingOptions"),
      constructionType: of(LISTING_CONSTRUCTION_TYPE_VALUES, "constructionTypeOptions"),
      propertyCondition: of(LISTING_PROPERTY_CONDITION_VALUES, "propertyConditionOptions"),
      storey: of(LISTING_STOREY_VALUES, "storeyOptions"),
      heating: of(LISTING_HEATING_VALUES, "heatingOptions"),
      ground: of(LISTING_GROUND_VALUES, "groundOptions"),
      furniture: of(LISTING_FURNITURE_VALUES, "furnitureOptions"),
      nearbyObjects: of(LISTING_NEARBY_OBJECT_VALUES, "nearbyObjectOptions"),
      additionalFeatures: of(LISTING_ADDITIONAL_FEATURE_VALUES, "additionalFeatureOptions"),
    };
  }, [t]);

  const isSale = draft.listingType === "forSale";

  // An empty total falls back to price per m² × surface on the card; showing
  // that figure as the placeholder lets the seller see what buyers will see.
  const pricePerSquare = Number(draft.priceEur);
  const surface = Number(draft.surfaceM2);
  const calculatedTotal =
    pricePerSquare > 0 && surface > 0
      ? getListingTotalPrice({
          listing_type: "forSale",
          price_eur: pricePerSquare,
          surface_m2: surface,
          total_price_eur: null,
        })
      : null;

  return (
    <div className="flex flex-col gap-8">
      <Section title={t("newListing.basicInformation")}>
        <LabeledSelectField
          label={t("newListing.categoryLabel")}
          placeholder={t("newListing.categoryPlaceholder")}
          options={options.category}
          value={draft.category}
          onChange={(value) => value && onDraftChange("category", value)}
        />
        <LabeledRadioField
          label={t("newListing.listingTypeLabel")}
          options={options.listingType}
          value={draft.listingType}
          onChange={(value) => {
            if (!value) return;
            onDraftChange("listingType", value);
            // A total only exists for a sale; clear it so switching back starts empty.
            if (value !== "forSale") onDraftChange("totalPriceEur", "");
          }}
        />
        <LabeledAutocompleteField<CitySuggestion>
          label={t("newListing.cityLabel")}
          placeholder={t("newListing.cityPlaceholder")}
          value={draft.city}
          onChangeText={(value) => onDraftChange("city", value)}
          onSelect={(suggestion) => {
            if (suggestion.municipality) onDraftChange("municipality", suggestion.municipality);
          }}
          fetchSuggestions={(query) => searchCities(query)}
          queryKey={(query) => queryKeys.citySearch(DEFAULT_COUNTRY_CODE, normalizeLocationText(query))}
          getItemLabel={(suggestion) => suggestion.city}
          getItemDescription={(suggestion) => suggestion.municipality}
        />
        <LabeledAutocompleteField
          label={t("newListing.municipalityLabel")}
          placeholder={t("newListing.municipalityPlaceholder")}
          value={draft.municipality}
          onChangeText={(value) => onDraftChange("municipality", value)}
          fetchSuggestions={(query) => searchMunicipalities(query, { city: draft.city || null })}
          queryKey={(query) =>
            queryKeys.municipalitySearch(DEFAULT_COUNTRY_CODE, draft.city, normalizeLocationText(query))
          }
          getItemLabel={(name) => name}
        />
        <LabeledAutocompleteField
          label={t("newListing.streetLabel")}
          placeholder={t("newListing.streetPlaceholder")}
          value={draft.street}
          onChangeText={(value) => onDraftChange("street", value)}
          fetchSuggestions={(query) => searchStreets(query, draft.city)}
          queryKey={(query) =>
            queryKeys.streetSearch(DEFAULT_COUNTRY_CODE, draft.city, "", normalizeLocationText(query))
          }
          getItemLabel={(name) => name}
          suggestionsEnabled={Boolean(draft.city.trim())}
        />
        <LabeledTextField
          label={t("newListing.streetNumberLabel")}
          placeholder={t("newListing.streetNumberPlaceholder")}
          value={draft.streetNumber}
          onChangeText={(value) => onDraftChange("streetNumber", value)}
          inputMode="numeric"
        />
        <LabeledTextField
          label={t("newListing.surfaceLabel")}
          placeholder={t("newListing.surfacePlaceholder")}
          value={draft.surfaceM2}
          onChangeText={(value) => onDraftChange("surfaceM2", sanitizeDecimalInput(value))}
          inputMode="decimal"
        />
        <LabeledTextField
          label={t("newListing.roomsLabel")}
          placeholder={t("newListing.roomsPlaceholder")}
          value={draft.rooms}
          onChangeText={(value) => onDraftChange("rooms", sanitizeDecimalInput(value))}
          inputMode="decimal"
        />
        <LabeledTextField
          label={isSale ? t("newListing.salePriceLabel") : t("newListing.rentPriceLabel")}
          placeholder={isSale ? t("newListing.salePricePlaceholder") : t("newListing.rentPricePlaceholder")}
          value={draft.priceEur}
          onChangeText={(value) => onDraftChange("priceEur", value)}
          inputMode="numeric"
        />
        {isSale ? (
          <LabeledTextField
            label={t("newListing.totalPriceLabel")}
            placeholder={calculatedTotal != null ? formatEuros(calculatedTotal) : t("newListing.totalPricePlaceholder")}
            hint={t("newListing.totalPriceHint")}
            value={draft.totalPriceEur}
            onChangeText={(value) => onDraftChange("totalPriceEur", sanitizeIntegerInput(value))}
            inputMode="numeric"
          />
        ) : null}
      </Section>

      <Section title={t("newListing.additionalInformation")}>
        <LabeledSelectField
          label={t("newListing.orientationLabel")}
          placeholder={t("newListing.orientationPlaceholder")}
          options={options.orientation}
          value={draft.orientation}
          onChange={(value) => onDraftChange("orientation", value)}
          allowEmpty
        />
        <LabeledSelectField
          label={t("newListing.parkingLabel")}
          placeholder={t("newListing.parkingPlaceholder")}
          options={options.parking}
          value={draft.parking}
          onChange={(value) => onDraftChange("parking", value)}
          allowEmpty
        />
        <LabeledSelectField
          label={t("newListing.constructionTypeLabel")}
          placeholder={t("newListing.constructionTypePlaceholder")}
          options={options.constructionType}
          value={draft.constructionType}
          onChange={(value) => onDraftChange("constructionType", value)}
          allowEmpty
        />
        <LabeledSelectField
          label={t("newListing.propertyConditionLabel")}
          placeholder={t("newListing.propertyConditionPlaceholder")}
          options={options.propertyCondition}
          value={draft.propertyCondition}
          onChange={(value) => onDraftChange("propertyCondition", value)}
          allowEmpty
        />
        <LabeledSelectField
          label={t("newListing.storeyLabel")}
          placeholder={t("newListing.storeyPlaceholder")}
          options={options.storey}
          value={draft.storey}
          onChange={(value) => onDraftChange("storey", value)}
          allowEmpty
        />
        {draft.storey === "floor" ? (
          <LabeledTextField
            label={t("newListing.storeyFloorNumberLabel")}
            placeholder={t("newListing.storeyFloorNumberPlaceholder")}
            value={draft.storeyFloorNumber}
            onChangeText={(value) => onDraftChange("storeyFloorNumber", value)}
            inputMode="numeric"
          />
        ) : null}
        <LabeledMultiSelectField
          label={t("newListing.heatingLabel")}
          placeholder={t("newListing.heatingPlaceholder")}
          options={options.heating}
          values={draft.heatingTypes}
          onChange={(value) => onDraftChange("heatingTypes", value)}
        />
        <LabeledSelectField
          label={t("newListing.groundLabel")}
          placeholder={t("newListing.groundPlaceholder")}
          options={options.ground}
          value={draft.groundType}
          onChange={(value) => onDraftChange("groundType", value)}
          allowEmpty
        />
        {draft.groundType === "other" ? (
          <LabeledTextField
            label={t("newListing.groundOtherLabel")}
            placeholder={t("newListing.groundOtherPlaceholder")}
            value={draft.groundOther}
            onChangeText={(value) => onDraftChange("groundOther", value)}
          />
        ) : null}
        <LabeledSelectField
          label={t("newListing.furnitureLabel")}
          placeholder={t("newListing.furniturePlaceholder")}
          options={options.furniture}
          value={draft.furniture}
          onChange={(value) => onDraftChange("furniture", value)}
          allowEmpty
        />
        <LabeledMultiSelectField
          label={t("newListing.nearbyObjectsLabel")}
          placeholder={t("newListing.nearbyObjectsPlaceholder")}
          options={options.nearbyObjects}
          values={draft.nearbyObjects}
          onChange={(value) => onDraftChange("nearbyObjects", value)}
        />
        <LabeledMultiSelectField
          label={t("newListing.additionalFeaturesLabel")}
          placeholder={t("newListing.additionalFeaturesPlaceholder")}
          options={options.additionalFeatures}
          values={draft.additionalFeatures}
          onChange={(value) => onDraftChange("additionalFeatures", value)}
        />
      </Section>

      <div>
        <label htmlFor={descriptionId} className="mb-1.5 block text-sm font-light text-form-label">
          {t("newListing.descriptionLabel")}
        </label>
        <textarea
          id={descriptionId}
          value={draft.description}
          onChange={(event) => onDraftChange("description", event.target.value)}
          placeholder={t("newListing.descriptionPlaceholder")}
          rows={7}
          className="w-full resize-y rounded-[25px] bg-surface-muted px-[15px] py-[15px] text-base leading-relaxed text-text placeholder:text-placeholder focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-display text-lg text-text">{title}</h2>
      <div className="grid gap-x-5 md:grid-cols-2">{children}</div>
    </section>
  );
}
