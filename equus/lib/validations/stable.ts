/**
 * Stable validation — Zod schemas for stable API input.
 */

import { z } from "zod";
import { horseDisciplineEnums, stableServiceEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";

export const stableAddressSchema = z.object({
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  street: z.string().trim().min(1),
  postCode: z.string().trim().min(1),
  state: z.string().trim().optional(),
  buildingNumber: z.string().trim().optional(),
  doorNumber: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  region: z.string().trim().optional(),
  additionalDetails: z.string().trim().optional(),
});

export const createStableSchema = z.object({
  tradeName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: emailSchema,
  phoneNumber: z.string().trim().min(1).max(40),
  address: stableAddressSchema,
  legalName: z.string().trim().max(120).optional(),
  websiteUrl: z.string().trim().url().optional(),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  services: z.array(z.enum(stableServiceEnums)).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewHorses: z.boolean().optional(),
});

export const updateStableDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewHorses: z.boolean().optional(),
});
