/**
 * Client-side Zod schema for the create-horse form.
 * Aligns with `createHorseSchema` in `lib/validations/horse.ts`.
 */

import { z } from "zod";
import {
  horseColorEnums,
  horseDisciplineEnums,
  horseSexEnums,
  visibilityEnums,
} from "../../utils/enums.ts";

export type HorseFormMessages = {
  required: string;
  invalidDate: string;
  invalidEnum: string;
  contactNameRequired: string;
  contactPhoneRequired: string;
  contactEmailRequired: string;
  contactEmailInvalid: string;
};

function requiredTrimmedString(messages: HorseFormMessages, max = 120) {
  return z
    .string()
    .trim()
    .min(1, { message: messages.required })
    .max(max);
}

function optionalTrimmedString(max?: number) {
  let schema = z.string().trim();
  if (max !== undefined) {
    schema = schema.max(max);
  }
  return schema;
}

function requiredEnum<T extends readonly [string, ...string[]]>(
  values: T,
  messages: HorseFormMessages,
) {
  return z
    .string()
    .refine((value) => value !== "" && (values as readonly string[]).includes(value), {
      message: messages.invalidEnum,
    });
}

function optionalEnum<T extends readonly [string, ...string[]]>(
  values: T,
  messages: HorseFormMessages,
) {
  return z
    .string()
    .refine((value) => value === "" || (values as readonly string[]).includes(value), {
      message: messages.invalidEnum,
    });
}

export function createHorseFormSchemas(messages: HorseFormMessages) {
  const contactDisplayFormSchema = z
    .object({
      useOwnerContact: z.enum(["true", "false"], {
        message: messages.invalidEnum,
      }),
      name: optionalTrimmedString(120),
      phone: optionalTrimmedString(40),
      email: z.string().trim(),
    })
    .superRefine((value, ctx) => {
      if (value.useOwnerContact === "false") {
        if (!value.name.trim()) {
          ctx.addIssue({
            code: "custom",
            message: messages.contactNameRequired,
            path: ["name"],
          });
        }
        if (!value.phone.trim()) {
          ctx.addIssue({
            code: "custom",
            message: messages.contactPhoneRequired,
            path: ["phone"],
          });
        }
        if (!value.email.trim()) {
          ctx.addIssue({
            code: "custom",
            message: messages.contactEmailRequired,
            path: ["email"],
          });
        } else if (!z.string().email().safeParse(value.email).success) {
          ctx.addIssue({
            code: "custom",
            message: messages.contactEmailInvalid,
            path: ["email"],
          });
        }
      }
    });

  const createHorseFormSchema = z.object({
    name: requiredTrimmedString(messages),
    breed: requiredTrimmedString(messages),
    sex: requiredEnum(horseSexEnums, messages),
    dateOfBirth: z
      .string()
      .refine(
        (value) => {
          if (value.trim() === "") return true;
          const date = new Date(value);
          return !Number.isNaN(date.getTime());
        },
        { message: messages.invalidDate },
      ),
    color: optionalEnum(horseColorEnums, messages),
    primaryDiscipline: optionalEnum(horseDisciplineEnums, messages),
    profileVisibility: z.enum(visibilityEnums, {
      message: messages.invalidEnum,
    }),
    contactDisplay: contactDisplayFormSchema,
  });

  return { createHorseFormSchema };
}

export function horseFormMessagesFromTranslations(
  t: (key: string) => string,
): HorseFormMessages {
  return {
    required: t("required"),
    invalidDate: t("invalidDate"),
    invalidEnum: t("invalidEnum"),
    contactNameRequired: t("contactNameRequired"),
    contactPhoneRequired: t("contactPhoneRequired"),
    contactEmailRequired: t("contactEmailRequired"),
    contactEmailInvalid: t("contactEmailInvalid"),
  };
}

const defaultSchemas = createHorseFormSchemas({
  required: "This field is required",
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
  contactNameRequired: "Contact name is required when not using owner contact",
  contactPhoneRequired: "Contact phone is required when not using owner contact",
  contactEmailRequired: "Contact email is required when not using owner contact",
  contactEmailInvalid: "Please provide a valid email address",
});

export const createHorseFormSchema = defaultSchemas.createHorseFormSchema;

export type CreateHorseFormValues = z.infer<typeof createHorseFormSchema>;

export const emptyCreateHorseFormValues: CreateHorseFormValues = {
  name: "",
  breed: "",
  sex: "",
  dateOfBirth: "",
  color: "",
  primaryDiscipline: "",
  profileVisibility: "public",
  contactDisplay: {
    useOwnerContact: "true",
    name: "",
    phone: "",
    email: "",
  },
};
