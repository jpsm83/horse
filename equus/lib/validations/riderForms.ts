/**
 * Client-side Zod schemas for rider profile web forms.
 *
 * `competitionHighlights` is a comma-separated string in the form; the
 * `useUpdateRiderProfile` hook splits it into a `string[]` for the API so typing
 * a list never fights the cursor (React-first, no refs). `experienceYears` stays
 * a string so an empty input clears the field.
 */

import { z } from "zod";

import { horseDisciplineEnums } from "../../utils/enums.ts";

const optionalNonNegativeYears = z
  .string()
  .trim()
  .refine((value) => {
    if (value === "") return true;
    const num = Number(value);
    return !Number.isNaN(num) && num >= 0;
  }, "Invalid experience years");

export const riderProfileFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().optional(),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().optional(),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  experienceYears: optionalNonNegativeYears,
  competitionHighlights: z.string().trim().optional(),
});

export type RiderProfileFormValues = z.infer<typeof riderProfileFormSchema>;
