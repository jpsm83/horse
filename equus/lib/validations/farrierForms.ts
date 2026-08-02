/**
 * Client-side Zod schemas for the farrier profile web form.
 *
 * `experienceYears` and `serviceAreaKm` stay strings so empty values clear the
 * fields; they are coerced to numbers before PATCH.
 */

import { z } from "zod";

/** Optional non-negative number — kept as a string so empty clears it. */
const optionalNumber = z
  .string()
  .trim()
  .refine((value) => {
    if (value === "") return true;
    const num = Number(value);
    return !Number.isNaN(num) && num >= 0;
  }, "Invalid number");

export const farrierProfileFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().max(40),
  experienceYears: optionalNumber,
  serviceAreaKm: optionalNumber,
});

export type FarrierProfileFormValues = z.infer<typeof farrierProfileFormSchema>;
