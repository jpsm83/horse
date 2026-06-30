/**
 * Coach validation — Zod schemas for coach API input.
 */

import { z } from "zod";
import { horseDisciplineEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

export const createCoachSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2000),
  email: emailSchema,
  phoneNumber: z.string().trim().min(1).max(40),
  address: stableAddressSchema,
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  competitionLevels: z.array(z.string().trim().min(1).max(80)).optional(),
  preparationServices: z.array(z.string().trim().min(1).max(120)).optional(),
  experienceYears: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});

export const updateCoachDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});
