/**
 * Horse validation — Zod schemas for horse API input.
 *
 * `updateHorseDiscoverySchema` is used by future `PATCH /api/v1/horses/:id/discovery`.
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
import { emailSchema } from "./common.ts";

const horsePedigreeSchema = z.object({
  sireName: z.string().trim().max(120).optional(),
  sireId: z.string().trim().max(120).optional(),
  damName: z.string().trim().max(120).optional(),
  damId: z.string().trim().max(120).optional(),
  bloodlineNotes: z.string().trim().optional(),
}).optional();

export const horseContactDisplaySchema = z
  .object({
    useOwnerContact: z.boolean().optional(),
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    email: emailSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.useOwnerContact === false) {
      if (!value.name?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Contact name is required when not using owner contact",
          path: ["name"],
        });
      }
      if (!value.phone?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Contact phone is required when not using owner contact",
          path: ["phone"],
        });
      }
      if (!value.email?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Contact email is required when not using owner contact",
          path: ["email"],
        });
      }
    }
  });

export const updateHorseDiscoverySchema = z.object({
  profileVisibility: z.enum(visibilityEnums).optional(),
  contactDisplay: horseContactDisplaySchema.optional(),
});

export const createHorseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  breed: z.enum(horseBreedEnums),
  sex: z.enum(horseSexEnums),

  // Identity extras
  registeredName: z.string().trim().max(120).optional(),
  registryId: z.string().trim().max(120).optional(),
  microchipId: z.string().trim().max(120).optional(),
  passportNumber: z.string().trim().max(120).optional(),
  dateOfBirth: z.coerce.date().optional(),
  ageYears: z.coerce.number().int().min(0).max(60).optional(),
  color: z.enum(horseColorEnums).optional(),
  marksDescription: z.string().trim().max(500).optional(),
  heightHands: z.coerce.number().min(0).max(30).optional(),
  primaryDiscipline: z.enum(horseDisciplineEnums).optional(),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  countryOfBirth: z.string().trim().max(100).optional(),
  importExportStatus: z.string().trim().max(100).optional(),

  // Commercial
  estimatedValue: z.coerce.number().min(0).optional(),
  valueCurrency: z.enum(currencyEnums).optional(),
  saleStatus: z.enum(saleStatusEnums).optional(),
  askingPrice: z.coerce.number().min(0).optional(),
  acquisitionDate: z.coerce.date().optional(),
  acquisitionSource: z.string().trim().max(200).optional(),
  showValuePublicly: z.boolean().optional(),

  // Pedigree
  pedigree: horsePedigreeSchema,

  // Media
  profileImageUrl: z.string().url().optional(),
  gallery: z.array(z.string().url()).optional(),
  description: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(5000).optional(),

  // Discovery
  profileVisibility: z.enum(visibilityEnums).optional(),
  contactDisplay: horseContactDisplaySchema.optional(),
});
