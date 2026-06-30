/**
 * Horse validation — Zod schemas for horse API input.
 *
 * `updateHorseDiscoverySchema` is used by future `PATCH /api/v1/horses/:id/discovery`.
 */

import { z } from "zod";
import { horseSexEnums, visibilityEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";

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
  breed: z.string().trim().min(1).max(120),
  sex: z.enum(horseSexEnums),
  dateOfBirth: z.coerce.date().optional(),
  color: z.string().trim().optional(),
  primaryDiscipline: z.string().trim().optional(),
  profileVisibility: z.enum(visibilityEnums).optional(),
  contactDisplay: horseContactDisplaySchema.optional(),
});
