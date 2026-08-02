/**
 * Client-side Zod schemas for stable profile web forms.
 */

import { z } from "zod";

import { horseDisciplineEnums, stableServiceEnums } from "../../utils/enums.ts";

export const stableAddressFormSchema = z.object({
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().optional(),
  street: z.string().trim().min(1),
  postCode: z.string().trim().min(1),
  buildingNumber: z.string().trim().optional(),
});

export const stableProfileFormSchema = z.object({
  tradeName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  services: z.array(z.enum(stableServiceEnums)).optional(),
  address: stableAddressFormSchema,
});

export type StableProfileFormValues = z.infer<typeof stableProfileFormSchema>;
