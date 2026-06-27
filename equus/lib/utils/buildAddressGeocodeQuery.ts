/**
 * Builds a free-text geocoding query from profile address fields.
 * Used by `ProfileAddressMap` (Nominatim). Unit-level fields are omitted — they hurt match quality.
 */

import { getCountryLabel, isValidCountryCode } from "@/lib/data/countries.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";

export type AddressGeocodeInput = {
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  buildingNumber?: string;
  postCode?: string;
  region?: string;
};

/** Street-first comma-joined query for Nominatim / postal geocoders. */
export function buildAddressGeocodeQuery(
  address: AddressGeocodeInput | undefined,
  locale: AppLocale,
): string {
  if (!address) return "";

  const countryCode = (address.country ?? "").trim().toUpperCase();
  const countryLabel = isValidCountryCode(countryCode)
    ? getCountryLabel(countryCode, locale)
    : countryCode;

  return [
    address.street,
    address.buildingNumber,
    address.city,
    address.state,
    address.postCode,
    address.region,
    countryLabel,
  ]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}
