/**
 * Transport validation — Zod schemas for transport API input.
 */

import { z } from "zod";
import { transportSpecialtyEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

export const createTransportSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: emailSchema,
  phoneNumber: z.string().trim().min(1).max(40),
  address: stableAddressSchema,
  legalName: z.string().trim().max(120).optional(),
  websiteUrl: z.string().trim().url().optional(),
  emergencyPhoneNumber: z.string().trim().min(1).max(40).optional(),
  specialties: z.array(z.enum(transportSpecialtyEnums)).optional(),
  serviceAreas: z.array(z.string().trim().min(1)).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewBookings: z.boolean().optional(),
});

export const updateTransportDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewBookings: z.boolean().optional(),
});
