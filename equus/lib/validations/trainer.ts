/**
 * Trainer validation — Zod schemas for trainer API input.
 */

import { z } from "zod";
import { horseDisciplineEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

export const createTrainerSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2000),
  email: emailSchema,
  phoneNumber: z.string().trim().min(1).max(40),
  address: stableAddressSchema,
  legalName: z.string().trim().max(120).optional(),
  specialties: z.array(z.enum(horseDisciplineEnums)).optional(),
  experienceYears: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});

export const updateTrainerDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});
