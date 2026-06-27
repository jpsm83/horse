/**
 * Maps between API `personalDetails` and profile form values / PATCH payloads.
 * Used by the profile page and `updateUserProfile` client helper.
 */

import type { ProfileFormValues } from "@/lib/validations/profileForms.ts";
import type { UpdatePersonalDetailsInput } from "@/lib/services/userService.ts";
import { emptyProfileFormValues } from "@/lib/validations/profileForms.ts";
import { normalizeLocale, type AppLocale } from "@/i18n/resolveLocale.ts";
import { isValidCountryCode } from "@/lib/data/countries.ts";

function formatDateForInput(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  return "";
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumberAsString(value: unknown): string {
  return typeof value === "number" && !Number.isNaN(value) ? String(value) : "";
}

function readCountryCode(value: unknown): string {
  const raw = readString(value).trim().toUpperCase();
  return isValidCountryCode(raw) ? raw : "";
}

/** Map API `personalDetails` to form default values. */
export function mapUserToProfileFormValues(
  personalDetails: Record<string, unknown> | undefined,
): ProfileFormValues {
  if (!personalDetails) {
    return { ...emptyProfileFormValues };
  }

  const address = personalDetails.address as Record<string, unknown> | undefined;
  const coordinates = address?.coordinates;

  let longitude = "";
  let latitude = "";
  if (Array.isArray(coordinates) && coordinates.length === 2) {
    longitude = readNumberAsString(coordinates[0]);
    latitude = readNumberAsString(coordinates[1]);
  }

  return {
    username: readString(personalDetails.username),
    preferredLanguage: normalizeLocale(readString(personalDetails.preferredLanguage)),
    timezone: readString(personalDetails.timezone),
    firstName: readString(personalDetails.firstName),
    lastName: readString(personalDetails.lastName),
    gender: readString(personalDetails.gender),
    birthDate: formatDateForInput(personalDetails.birthDate),
    nationality: readCountryCode(personalDetails.nationality),
    phoneNumber: readString(personalDetails.phoneNumber),
    bio: readString(personalDetails.bio),
    idType: readString(personalDetails.idType),
    idNumber: readString(personalDetails.idNumber),
    address: {
      country: readCountryCode(address?.country),
      state: readString(address?.state),
      city: readString(address?.city),
      street: readString(address?.street),
      buildingNumber: readString(address?.buildingNumber),
      doorNumber: readString(address?.doorNumber),
      complement: readString(address?.complement),
      postCode: readString(address?.postCode),
      region: readString(address?.region),
      additionalDetails: readString(address?.additionalDetails),
      longitude,
      latitude,
    },
  };
}

function omitEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Map validated form values to a PATCH payload (omits empty fields). */
export function mapProfileFormValuesToPatch(
  values: ProfileFormValues,
): UpdatePersonalDetailsInput {
  const patch: UpdatePersonalDetailsInput = {
    preferredLanguage: normalizeLocale(values.preferredLanguage) as AppLocale,
  };

  const scalarFields = [
    "username",
    "timezone",
    "firstName",
    "lastName",
    "gender",
    "nationality",
    "phoneNumber",
    "bio",
    "idType",
    "idNumber",
  ] as const;

  for (const key of scalarFields) {
    const value = omitEmpty(values[key]);
    if (value !== undefined) {
      if (key === "gender") {
        patch.gender = value as UpdatePersonalDetailsInput["gender"];
      } else if (key === "idType") {
        patch.idType = value as UpdatePersonalDetailsInput["idType"];
      } else {
        patch[key] = value;
      }
    }
  }

  if (values.birthDate.trim() !== "") {
    patch.birthDate = new Date(values.birthDate);
  }

  const addr = values.address;
  const hasAddressText = [
    addr.country,
    addr.state,
    addr.city,
    addr.street,
    addr.buildingNumber,
    addr.postCode,
  ].some((v) => v.trim() !== "");
  const hasCoords = addr.longitude.trim() !== "" || addr.latitude.trim() !== "";

  if (hasAddressText || hasCoords) {
    const address: NonNullable<UpdatePersonalDetailsInput["address"]> = {
      country: addr.country.trim(),
      state: addr.state.trim(),
      city: addr.city.trim(),
      street: addr.street.trim(),
      buildingNumber: addr.buildingNumber.trim(),
      postCode: addr.postCode.trim(),
    };

    const doorNumber = omitEmpty(addr.doorNumber);
    if (doorNumber) address.doorNumber = doorNumber;
    const complement = omitEmpty(addr.complement);
    if (complement) address.complement = complement;
    const region = omitEmpty(addr.region);
    if (region) address.region = region;
    const additionalDetails = omitEmpty(addr.additionalDetails);
    if (additionalDetails) address.additionalDetails = additionalDetails;

    if (hasCoords) {
      address.coordinates = [Number(addr.longitude), Number(addr.latitude)];
    }

    patch.address = address;
  }

  return patch;
}
