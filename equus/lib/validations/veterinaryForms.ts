/**
 * Client-side Zod schemas for veterinary profile web forms.
 */

import { z } from "zod";

export const veterinaryAddressFormSchema = z.object({
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().optional(),
  street: z.string().trim().min(1),
  postCode: z.string().trim().min(1),
  buildingNumber: z.string().trim().optional(),
});

export const veterinaryProfileFormSchema = z.object({
  practiceName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  emergencyPhoneNumber: z.string().trim().max(40).optional().or(z.literal("")),
  serviceAreaKm: z.number().int().min(0).optional(),
  emergencyAvailability: z.boolean().optional(),
  address: veterinaryAddressFormSchema,
});

export type VeterinaryProfileFormValues = z.infer<typeof veterinaryProfileFormSchema>;
