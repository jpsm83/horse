/**
 * Client-side Zod schemas for auth web forms (sign-in, sign-up).
 * Messages are injected from next-intl translations.
 */

import { z } from "zod";
import emailRegex from "../utils/emailRegex.ts";
import { isValidPassword } from "../utils/passwordPolicy.ts";

export type AuthFormMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordPolicy: string;
  confirmPasswordRequired: string;
  passwordsMismatch: string;
};

function createFormEmailSchema(messages: AuthFormMessages) {
  return z
    .string()
    .trim()
    .min(1, messages.emailRequired)
    .transform((value) => value.toLowerCase())
    .refine((value) => emailRegex.test(value), messages.emailInvalid);
}

function createSignUpPasswordSchema(messages: AuthFormMessages) {
  return z
    .string()
    .min(1, messages.passwordRequired)
    .refine(isValidPassword, messages.passwordPolicy);
}

export function createAuthFormSchemas(messages: AuthFormMessages) {
  const formEmailSchema = createFormEmailSchema(messages);
  const signUpPasswordSchema = createSignUpPasswordSchema(messages);

  const signInFormSchema = z.object({
    email: formEmailSchema,
    password: z.string().min(1, messages.passwordRequired),
  });

  const signUpFormSchema = z.object({
    firstName: z.string().trim().max(50).optional(),
    lastName: z.string().trim().max(50).optional(),
    email: formEmailSchema,
    password: signUpPasswordSchema,
  });

  const forgotPasswordFormSchema = z.object({
    email: formEmailSchema,
  });

  const resendConfirmationFormSchema = z.object({
    email: formEmailSchema,
  });

  const resetPasswordFormSchema = z
    .object({
      newPassword: signUpPasswordSchema,
      confirmPassword: z.string().min(1, messages.confirmPasswordRequired),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: messages.passwordsMismatch,
      path: ["confirmPassword"],
    });

  return {
    signInFormSchema,
    signUpFormSchema,
    forgotPasswordFormSchema,
    resendConfirmationFormSchema,
    resetPasswordFormSchema,
  };
}

export function authFormMessagesFromTranslations(
  t: (key: string) => string,
): AuthFormMessages {
  return {
    emailRequired: t("emailRequired"),
    emailInvalid: t("emailInvalid"),
    passwordRequired: t("passwordRequired"),
    passwordPolicy: t("passwordPolicy"),
    confirmPasswordRequired: t("confirmPasswordRequired"),
    passwordsMismatch: t("passwordsMismatch"),
  };
}

const defaultMessages: AuthFormMessages = {
  emailRequired: "Email is required",
  emailInvalid: "Please provide a valid email address",
  passwordRequired: "Password is required",
  passwordPolicy:
    "Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number, and a symbol.",
  confirmPasswordRequired: "Please confirm your password",
  passwordsMismatch: "Passwords do not match",
};

const defaultSchemas = createAuthFormSchemas(defaultMessages);

export const signInFormSchema = defaultSchemas.signInFormSchema;
export const signUpFormSchema = defaultSchemas.signUpFormSchema;
export const forgotPasswordFormSchema = defaultSchemas.forgotPasswordFormSchema;
export const resendConfirmationFormSchema = defaultSchemas.resendConfirmationFormSchema;
export const resetPasswordFormSchema = defaultSchemas.resetPasswordFormSchema;

export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResendConfirmationFormValues = z.infer<typeof resendConfirmationFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
