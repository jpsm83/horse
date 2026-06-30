/**
 * Breeder validation — Zod schemas for breeder API input.
 */

import { z } from "zod";
import { horseDisciplineEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

export const createBreederSchema = z.object({
  operationName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: emailSchema,
  phoneNumber: z.string().trim().min(1).max(40),
  address: stableAddressSchema,
  legalName: z.string().trim().max(120).optional(),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  bloodlines: z.array(z.string().trim().min(1)).optional(),
  isPublic: z.boolean().optional(),
});

export const updateBreederDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
});
