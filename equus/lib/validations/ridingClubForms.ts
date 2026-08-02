/**
 * Client-side Zod schemas for riding club profile web forms.
 */

import { z } from "zod";

import { horseDisciplineEnums } from "../../utils/enums.ts";

export const ridingClubAddressFormSchema = z.object({
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().optional(),
  street: z.string().trim().min(1),
  postCode: z.string().trim().min(1),
  buildingNumber: z.string().trim().optional(),
});

/** Optional non-negative membership fee — kept as a string so empty clears it. */
const optionalMembershipFee = z
  .string()
  .trim()
  .refine((value) => {
    if (value === "") return true;
    const num = Number(value);
    return !Number.isNaN(num) && num >= 0;
  }, "Invalid membership fee");

export const ridingClubProfileFormSchema = z.object({
  clubName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  facilities: z.string().trim().optional(),
  membershipInfo: z.string().trim().max(2000).optional(),
  membershipFee: optionalMembershipFee,
  address: ridingClubAddressFormSchema,
});

export type RidingClubProfileFormValues = z.infer<typeof ridingClubProfileFormSchema>;
