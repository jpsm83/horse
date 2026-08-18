/**
 * Horse validation — Zod schemas for horse API input.
 *
 * `updateHorseDiscoverySchema` — Layer-1 `PATCH /api/v1/horses/:id/discovery`
 * `updateHorseHubSectionsSchema` — Layer-2 `PATCH /api/v1/horses/:id/hub-sections`
 */

import { z } from "zod";
import {
  currencyEnums,
  horseBreedEnums,
  horseColorEnums,
  horseDisciplineEnums,
  horseSexEnums,
  saleStatusEnums,
  visibilityEnums,
} from "../../utils/enums.ts";
import { isValidCountryCode } from "../data/countries.ts";
import { hubSectionsSchema } from "../horses/hubSections.ts";
import {
  hasAtLeastOneHorseIdentity,
  HORSE_IDENTITY_REQUIRED_MESSAGE,
  normalizeHorseIdentityFields,
  normalizeHorseIdentityValue,
} from "../utils/horseIdentity.ts";

const horsePedigreeSchema = z.object({
  sireName: z.string().trim().max(120).optional(),
  sireHorseId: z.string().nullable().optional(),
  damName: z.string().trim().max(120).optional(),
  damHorseId: z.string().nullable().optional(),
  bloodlineNotes: z.string().trim().optional(),
}).optional();

/** Layer-1 global horse visibility (Admin Visibility section). */
export const updateHorseDiscoverySchema = z.object({
  profileVisibility: z.enum(visibilityEnums).optional(),
});

/** Layer-2 Hub section visibility (section popovers; partial map). */
export const updateHorseHubSectionsSchema = z.object({
  hubSections: hubSectionsSchema,
}).refine(
  (data) => Object.values(data.hubSections).some((section) => section?.mode !== undefined),
  { message: "At least one hubSections entry with mode is required" },
);

export const createHorseSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    breed: z.enum(horseBreedEnums),
    sex: z.enum(horseSexEnums),

    registeredName: z.string().trim().max(120).optional(),
    registryId: z.string().trim().max(120).optional(),
    microchipId: z.string().trim().max(120).optional(),
    passportNumber: z.string().trim().max(120).optional(),
    dateOfBirth: z.coerce.date().optional(),
    color: z.enum(horseColorEnums).optional(),
    heightHands: z.coerce.number().min(0).max(30).optional(),
    disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
    countryOfBirth: z.string().refine((v): boolean => isValidCountryCode(v), { message: "Invalid country code" }),

    estimatedValue: z.coerce.number().min(0).optional(),
    valueCurrency: z.enum(currencyEnums).optional(),
    saleStatus: z.enum(saleStatusEnums).optional(),
    askingPrice: z.coerce.number().min(0).optional(),
    acquisitionDate: z.coerce.date().optional(),

    pedigree: horsePedigreeSchema,

    profileImageUrl: z.string().url().optional(),
    gallery: z.array(z.string().url()).optional(),
    description: z.string().trim().max(2000).optional(),

    profileVisibility: z.enum(visibilityEnums).optional(),

    waitingTransfer: z
      .object({
        invitedOwnerEmail: z.string().email(),
        hostStableId: z.string().min(1),
      })
      .optional(),
  })
  .transform((data) => {
    // Spread `ids` (optional-keyed) so the inferred output type keeps the
    // identity fields optional — assigning `ids.registryId` directly would force
    // `registryId: string | undefined` (required key) on the output type.
    const ids = normalizeHorseIdentityFields(data);
    return {
      ...data,
      ...ids,
    };
  });

export const updateHorseProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    breed: z.enum(horseBreedEnums).optional(),
    sex: z.enum(horseSexEnums).optional(),
    registeredName: z.string().trim().max(120).optional(),
    registryId: z.string().trim().max(120).optional(),
    microchipId: z.string().trim().max(120).optional(),
    passportNumber: z.string().trim().max(120).optional(),
    dateOfBirth: z.coerce.date().optional(),
    color: z.enum(horseColorEnums).optional(),
    heightHands: z.coerce.number().min(0).max(30).optional(),
    disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
    countryOfBirth: z.string().refine((v): boolean => isValidCountryCode(v), { message: "Invalid country code" }).optional(),
    estimatedValue: z.coerce.number().min(0).optional(),
    valueCurrency: z.enum(currencyEnums).optional(),
    saleStatus: z.enum(saleStatusEnums).optional(),
    askingPrice: z.coerce.number().min(0).optional(),
    acquisitionDate: z.coerce.date().optional(),
    pedigree: horsePedigreeSchema.optional(),
    profileImageUrl: z.string().url().optional(),
    heroImageUrl: z.string().url().optional(),
    gallery: z.array(z.string().url()).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    const allIdentityPresent =
      data.registryId !== undefined &&
      data.microchipId !== undefined &&
      data.passportNumber !== undefined;
    if (allIdentityPresent && !hasAtLeastOneHorseIdentity(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: HORSE_IDENTITY_REQUIRED_MESSAGE,
        path: ["registryId"],
      });
    }
  })
  .transform((data) => {
    const next = { ...data };
    if (data.registryId !== undefined) {
      next.registryId = normalizeHorseIdentityValue(data.registryId);
    }
    if (data.microchipId !== undefined) {
      next.microchipId = normalizeHorseIdentityValue(data.microchipId);
    }
    if (data.passportNumber !== undefined) {
      next.passportNumber = normalizeHorseIdentityValue(data.passportNumber);
    }
    return next;
  });
