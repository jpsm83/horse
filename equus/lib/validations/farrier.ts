/**
 * Farrier validation — Zod schemas for farrier API input.
 */

import { z } from "zod";
import { emailSchema } from "./common.ts";
import { stableAddressSchema } from "./stable.ts";

export const createFarrierSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: emailSchema,
  bio: z.string().trim().min(1).max(2000).optional(),
  phoneNumber: z.string().trim().min(1).max(40).optional(),
  address: stableAddressSchema.optional(),
  experienceYears: z.number().int().min(0).optional(),
  serviceAreaKm: z.number().min(0).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});

export const updateFarrierDiscoverySchema = z.object({
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
});

/** Owner profile update — partial fields; empty strings clear optional fields. */
export const updateFarrierProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  email: emailSchema.optional(),
  bio: z.string().trim().min(1).max(2000).optional().or(z.literal("")),
  phoneNumber: z.string().trim().min(1).max(40).optional().or(z.literal("")),
  address: stableAddressSchema.partial().optional(),
  experienceYears: z.number().int().min(0).optional(),
  serviceAreaKm: z.number().min(0).optional(),
  isPublic: z.boolean().optional(),
  acceptsNewClients: z.boolean().optional(),
  legalName: z.string().trim().max(120).optional().or(z.literal("")),
});
