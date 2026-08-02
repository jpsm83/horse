/**
 * Client-side Zod schemas for breeder profile web forms.
 *
 * `bloodlines` is a free-text comma-separated string in the form; the
 * `useUpdateBreederProfile` hook splits it into a `string[]` for the API so
 * typing a list never fights the cursor (React-first, no refs).
 */

import { z } from "zod";

import { horseDisciplineEnums } from "../../utils/enums.ts";

export const breederAddressFormSchema = z.object({
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().optional(),
  street: z.string().trim().min(1),
  postCode: z.string().trim().min(1),
  buildingNumber: z.string().trim().optional(),
});

export const breederProfileFormSchema = z.object({
  operationName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  bloodlines: z.string().trim().optional(),
  address: breederAddressFormSchema,
});

export type BreederProfileFormValues = z.infer<typeof breederProfileFormSchema>;
