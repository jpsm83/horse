/**
 * Client-side Zod schemas for transport profile web forms.
 */

import { z } from "zod";

import { transportSpecialtyEnums } from "../../utils/enums.ts";

export const transportAddressFormSchema = z.object({
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().optional(),
  street: z.string().trim().min(1),
  postCode: z.string().trim().min(1),
  buildingNumber: z.string().trim().optional(),
});

export const transportProfileFormSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  emergencyPhoneNumber: z.string().trim().max(40).optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  specialties: z.array(z.enum(transportSpecialtyEnums)).optional(),
  serviceAreas: z.array(z.string().trim().min(1)).optional(),
  address: transportAddressFormSchema,
});

export type TransportProfileFormValues = z.infer<typeof transportProfileFormSchema>;
