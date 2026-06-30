/**
 * Groom validation — Zod schemas for groom API input.
 */

import { z } from "zod";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

export const createGroomSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: emailSchema,
  bio: z.string().trim().min(1).max(2000).optional(),
  phoneNumber: z.string().trim().min(1).max(40).optional(),
  address: stableAddressSchema.optional(),
  specialties: z.array(z.string().trim().min(1)).optional(),
  experienceYears: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});

export const updateGroomDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});
