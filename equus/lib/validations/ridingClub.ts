/**
 * Riding club validation — Zod schemas for riding club API input.
 */

import { z } from "zod";
import { horseDisciplineEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

export const createRidingClubSchema = z.object({
  clubName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: emailSchema,
  phoneNumber: z.string().trim().min(1).max(40),
  address: stableAddressSchema,
  legalName: z.string().trim().max(120).optional(),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  facilities: z.array(z.string().trim().min(1)).optional(),
  membershipInfo: z.string().trim().max(2000).optional(),
  membershipFee: z.number().min(0).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewMembers: z.boolean().optional(),
});

export const updateRidingClubDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewMembers: z.boolean().optional(),
});
