/**
 * Client-side Zod schemas for trainer profile web forms.
 */

import { z } from "zod";

import { horseDisciplineEnums } from "../../utils/enums.ts";

export const trainerAddressFormSchema = z.object({
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().optional(),
  street: z.string().trim().min(1),
  postCode: z.string().trim().min(1),
  buildingNumber: z.string().trim().optional(),
});

export const trainerProfileFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  legalName: z.string().trim().max(120).optional().or(z.literal("")),
  specialties: z.array(z.enum(horseDisciplineEnums)).optional(),
  experienceYears: z.number().int().min(0).optional(),
  address: trainerAddressFormSchema,
});

export type TrainerProfileFormValues = z.infer<typeof trainerProfileFormSchema>;
