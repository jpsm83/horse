/**
 * User profile validation — Zod schemas for `PATCH /api/v1/users/me`.
 *
 * Omitted field = no change. Empty string (`""`) = remove stored value (`$unset` in userService).
 */

import { z } from "zod";
import {
  genderEnums,
  idTypeEnums,
  appLocaleEnums,
  userDirectMessageAudienceEnums,
  userProfileVisibilityEnums,
} from "../../utils/enums.ts";
import { isKnownCountryCode } from "../data/countries.ts";
import { objectIdSchema } from "./common.ts";

/** `GET /api/v1/users/:id` path param */
export const userIdParamSchema = objectIdSchema;

const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((code) => isKnownCountryCode(code), { message: "Invalid country code" });

/** Trimmed non-empty value, or `""` to clear. */
function patchString(max?: number) {
  const filled = max ? z.string().trim().min(1).max(max) : z.string().trim().min(1);
  return z.union([filled, z.literal("")]);
}

function patchCountryCode() {
  return z.union([countryCodeSchema, z.literal("")]);
}

function patchEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.union([z.enum(values), z.literal("")]);
}

export const addressSchema = z.object({
  country: patchCountryCode().optional(),
  state: patchString().optional(),
  city: patchString().optional(),
  street: patchString().optional(),
  buildingNumber: patchString().optional(),
  postCode: patchString().optional(),
  doorNumber: patchString().optional(),
  complement: patchString().optional(),
  region: patchString().optional(),
  additionalDetails: patchString().optional(),
  coordinates: z
    .union([z.tuple([z.number(), z.number()]), z.literal("")])
    .optional(),
});

export const updatePersonalDetailsSchema = z.object({
  username: patchString(50).optional(),
  idType: patchEnum(idTypeEnums).optional(),
  idNumber: patchString().optional(),
  address: z.union([addressSchema, z.null()]).optional(),
  firstName: patchString(50).optional(),
  lastName: patchString(50).optional(),
  nationality: patchCountryCode().optional(),
  gender: patchEnum(genderEnums).optional(),
  birthDate: z.union([z.literal(""), z.coerce.date()]).optional(),
  phoneNumber: patchString().optional(),
  bio: z.union([z.string().trim().max(2000), z.literal("")]).optional(),
  preferredLanguage: z.enum(appLocaleEnums).optional(),
  preferences: z
    .object({
      profileVisibility: patchEnum(userProfileVisibilityEnums).optional(),
      allowDirectMessagesFrom: patchEnum(userDirectMessageAudienceEnums).optional(),
    })
    .optional(),
});
