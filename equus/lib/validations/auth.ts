import { z } from "zod";
import { emailSchema } from "./common.ts";
import { isValidPassword } from "../utils/passwordPolicy.ts";
import { appLocaleEnums, userTypeEnums } from "../../utils/enums.ts";

const passwordSchema = z
  .string()
  .refine(isValidPassword, "Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number, and a symbol.");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: z.string().trim().min(1).max(50).optional(),
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  referralReference: z.string().trim().min(1).max(100).optional(),
  preferredLanguage: z.enum(appLocaleEnums).optional(),
  userType: z.enum(userTypeEnums).optional(),
  businessDetails: z.object({
    businessName: z.string().trim().min(1).max(200).optional(),
    registrationNumber: z.string().trim().min(1).max(100).optional(),
    taxId: z.string().trim().min(1).max(100).optional(),
    countryOfRegistration: z.string().trim().length(2).optional(),
  }).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const requestEmailSchema = z.object({
  email: emailSchema,
});

export const confirmEmailSchema = z.object({
  token: z.string().trim().min(1, "Please provide a confirmation token"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Please provide a reset token"),
  newPassword: passwordSchema,
});

export const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1).optional(),
});
