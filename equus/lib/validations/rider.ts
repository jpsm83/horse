/**
 * Rider validation — Zod schemas for rider API input.
 */

import { z } from "zod";
import { horseDisciplineEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

export const createRiderSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: emailSchema,
  bio: z.string().trim().min(1).max(2000).optional(),
  phoneNumber: z.string().trim().min(1).max(40).optional(),
  address: stableAddressSchema.optional(),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  experienceYears: z.number().int().min(0).optional(),
  competitionHighlights: z.array(z.string().trim().min(1).max(120)).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});

export const updateRiderDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});
