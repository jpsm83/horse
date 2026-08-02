/**
 * Client-side Zod schemas for coach profile web forms.
 *
 * `competitionLevels` and `preparationServices` are comma-separated strings in
 * the form; the `useUpdateCoachProfile` hook splits them into `string[]` for the
 * API so typing a list never fights the cursor (React-first, no refs).
 * `experienceYears` stays a string so an empty input clears the field.
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

export const coachProfileFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  competitionLevels: z.string().trim().optional(),
  preparationServices: z.string().trim().optional(),
  experienceYears: optionalNonNegativeYears,
});

export type CoachProfileFormValues = z.infer<typeof coachProfileFormSchema>;
