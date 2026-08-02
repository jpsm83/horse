/**
 * Client-side Zod schemas for the groom profile web form.
 *
 * `specialties` is edited as a comma-separated string so free-text values need
 * no picker; it is split into an array before PATCH. `experienceYears` stays a
 * string so an empty value can clear the field.
 */

import { z } from "zod";

/** Optional non-negative integer — kept as a string so empty clears it. */
const optionalExperienceYears = z
  .string()
  .trim()
  .refine((value) => {
    if (value === "") return true;
    const num = Number(value);
    return !Number.isNaN(num) && Number.isInteger(num) && num >= 0;
  }, "Invalid number");

export const groomProfileFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().max(40),
  specialties: z.string().trim().optional(),
  experienceYears: optionalExperienceYears,
});

export type GroomProfileFormValues = z.infer<typeof groomProfileFormSchema>;
