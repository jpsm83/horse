/**
 * Veterinary validation — Zod schemas for veterinary API input.
 */

import { z } from "zod";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

const equineSpecializationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export const createVeterinarySchema = z.object({
  practiceName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: emailSchema,
  phoneNumber: z.string().trim().min(1).max(40),
  address: stableAddressSchema,
  legalName: z.string().trim().max(120).optional(),
  emergencyPhoneNumber: z.string().trim().min(1).max(40).optional(),
  equineSpecializations: z.array(equineSpecializationSchema).optional(),
  certifications: z.array(z.string().trim().min(1).max(120)).optional(),
  licenseNumber: z.string().trim().max(80).optional(),
  emergencyAvailability: z.boolean().optional(),
  emergencyCoverageNotes: z.string().trim().max(1000).optional(),
  serviceAreaKm: z.number().min(0).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewPatients: z.boolean().optional(),
});

export const updateVeterinaryDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewPatients: z.boolean().optional(),
});
