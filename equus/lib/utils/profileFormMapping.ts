/**
 * Maps between API `personalDetails` and profile form values / PATCH payloads.
 */

import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { ProfileFormValues } from "@/lib/validations/profileForms.ts";
import type { UpdatePersonalDetailsInput } from "@/lib/services/userService.ts";
import { normalizeLocale, type AppLocale } from "@/i18n/resolveLocale.ts";
import { isValidCountryCode } from "@/lib/data/countries.ts";

const ADDRESS_CORE_FIELDS = [
  "country",
  "state",
  "city",
  "street",
  "buildingNumber",
  "postCode",
] as const;

const ADDRESS_OPTIONAL_FIELDS = [
  "doorNumber",
  "complement",
  "region",
  "additionalDetails",
] as const;

const SCALAR_FIELDS = [
  "username",
  "firstName",
  "lastName",
  "gender",
  "nationality",
  "phoneNumber",
  "bio",
  "idType",
  "idNumber",
] as const;

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
  if (typeof value !== "string") {
    return "";
  }
  return value.trim() === "null" ? "" : value;
}

function readCountryCode(value: unknown): string {
  const raw = readString(value).trim().toUpperCase();
  return isValidCountryCode(raw) ? raw : "";
}

function coordsEqual(
  a: [number, number] | null,
  b: [number, number] | null,
): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a[0] === b[0] && a[1] === b[1];
}

/** Read Mongo `[longitude, latitude]` as `[lng, lat]` or null. */
export function readAddressCoordinates(
  address: Record<string, unknown> | undefined,
): [number, number] | null {
  const coordinates = address?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const lng = coordinates[0];
  const lat = coordinates[1];
  if (
    typeof lng !== "number" ||
    typeof lat !== "number" ||
    Number.isNaN(lng) ||
    Number.isNaN(lat)
  ) {
    return null;
  }

  return [lng, lat];
}

/** Map API `personalDetails` to form default values. */
export function mapUserToProfileFormValues(
  personalDetails: Record<string, unknown> | undefined,
  preferences?: Record<string, unknown>,
): ProfileFormValues {
  if (!personalDetails) {
    return {
      username: "",
      preferredLanguage: "en",
      firstName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      nationality: "",
      phoneNumber: "",
      bio: "",
      idType: "",
      idNumber: "",
      profileVisibility: "public",
      allowDirectMessagesFrom: "everyone",
      address: {
        country: "",
        state: "",
        city: "",
        street: "",
        buildingNumber: "",
        doorNumber: "",
        complement: "",
        postCode: "",
        region: "",
        additionalDetails: "",
      },
    };
  }

  const address = personalDetails.address as Record<string, unknown> | undefined;

  return {
    username: readString(personalDetails.username),
    preferredLanguage: normalizeLocale(readString(personalDetails.preferredLanguage)),
    firstName: readString(personalDetails.firstName),
    lastName: readString(personalDetails.lastName),
    gender: readString(personalDetails.gender),
    birthDate: formatDateForInput(personalDetails.birthDate),
    nationality: readCountryCode(personalDetails.nationality),
    phoneNumber: readString(personalDetails.phoneNumber),
    bio: readString(personalDetails.bio),
    idType: readString(personalDetails.idType),
    idNumber: readString(personalDetails.idNumber),
    profileVisibility:
      (readString(preferences?.profileVisibility) || "public") as ProfileFormValues["profileVisibility"],
    allowDirectMessagesFrom:
      (readString(preferences?.allowDirectMessagesFrom) || "everyone") as ProfileFormValues["allowDirectMessagesFrom"],
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
    },
  };
}

type ProfileDirtyFields = Partial<FieldNamesMarkedBoolean<ProfileFormValues>>;

type MapProfilePatchOptions = {
  coordinates?: [number, number] | null;
  savedCoordinates?: [number, number] | null;
};

/**
 * Build a PATCH from dirty form fields only.
 * Empty string on a dirty field clears it in the database.
 */
export function mapProfileFormValuesToPatch(
  values: ProfileFormValues,
  dirtyFields: ProfileDirtyFields,
  options: MapProfilePatchOptions = {},
): UpdatePersonalDetailsInput {
  const coordinates = options.coordinates ?? null;
  const savedCoordinates = options.savedCoordinates ?? null;
  const coordinatesDirty = !coordsEqual(coordinates, savedCoordinates);

  const patch: UpdatePersonalDetailsInput = {};

  if (dirtyFields.preferredLanguage) {
    patch.preferredLanguage = normalizeLocale(values.preferredLanguage) as AppLocale;
  }

  if (
    dirtyFields.profileVisibility ||
    dirtyFields.allowDirectMessagesFrom
  ) {
    patch.preferences = {};

    if (dirtyFields.profileVisibility) {
      patch.preferences.profileVisibility = values.profileVisibility;
    }
    if (dirtyFields.allowDirectMessagesFrom) {
      patch.preferences.allowDirectMessagesFrom = values.allowDirectMessagesFrom;
    }
  }

  for (const key of SCALAR_FIELDS) {
    if (!dirtyFields[key]) {
      continue;
    }

    const raw = values[key].trim();
    if (key === "gender") {
      patch.gender = raw as UpdatePersonalDetailsInput["gender"];
    } else if (key === "idType") {
      patch.idType = raw as UpdatePersonalDetailsInput["idType"];
    } else {
      patch[key] = raw;
    }
  }

  if (dirtyFields.birthDate) {
    patch.birthDate =
      values.birthDate.trim() === "" ? "" : new Date(values.birthDate);
  }

  const addressDirty = dirtyFields.address;
  if (addressDirty || coordinatesDirty) {
    const coreEmpty = ADDRESS_CORE_FIELDS.every(
      (key) => values.address[key].trim() === "",
    );

    if (coreEmpty && !coordinates) {
      patch.address = null;
    } else {
      const address: NonNullable<UpdatePersonalDetailsInput["address"]> = {} as NonNullable<
        UpdatePersonalDetailsInput["address"]
      >;

      for (const key of [...ADDRESS_CORE_FIELDS, ...ADDRESS_OPTIONAL_FIELDS]) {
        if (addressDirty?.[key]) {
          address[key] = values.address[key].trim();
        }
      }

      if (coordinatesDirty) {
        address.coordinates = coordinates ?? "";
      }

      if (Object.keys(address).length > 0) {
        patch.address = address;
      }
    }
  }

  return patch;
}
