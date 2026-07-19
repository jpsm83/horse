/**
 * Client-side Zod schema for the create-horse form.
 * Aligns with `createHorseSchema` in `lib/validations/horse.ts`.
 */

import { z } from "zod";
import {
  currencyEnums,
  horseBreedEnums,
  horseColorEnums,
  horseDisciplineEnums,
  horseSexEnums,
  saleStatusEnums,
  visibilityEnums,
} from "../../utils/enums.ts";

export type HorseFormMessages = {
  required: string;
  invalidDate: string;
  invalidEnum: string;
  invalidNumber: string;
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

function optionalNumber(messages: HorseFormMessages) {
  return z
    .string()
    .refine(
      (value) => {
        if (value.trim() === "") return true;
        const num = Number(value);
        return !Number.isNaN(num) && num >= 0;
      },
      { message: messages.invalidNumber },
    );
}

function optionalCurrency(messages: HorseFormMessages) {
  return z
    .string()
    .refine(
      (value) =>
        value === "" || (currencyEnums as readonly string[]).includes(value),
      { message: messages.invalidEnum },
    );
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

  const pedigreeFormSchema = z.object({
    sireName: optionalTrimmedString(120),
    sireId: optionalTrimmedString(120),
    damName: optionalTrimmedString(120),
    damId: optionalTrimmedString(120),
    bloodlineNotes: optionalTrimmedString(1000),
  });

  const createHorseFormSchema = z.object({
    // Required identity
    name: requiredTrimmedString(messages),
    breed: requiredEnum(horseBreedEnums, messages),
    sex: requiredEnum(horseSexEnums, messages),

    // Identity extras
    registeredName: optionalTrimmedString(120),
    registryId: optionalTrimmedString(120),
    microchipId: optionalTrimmedString(120),
    passportNumber: optionalTrimmedString(120),
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
    ageYears: optionalNumber(messages),
    color: optionalEnum(horseColorEnums, messages),
    marksDescription: optionalTrimmedString(500),
    heightHands: optionalNumber(messages),
    primaryDiscipline: optionalEnum(horseDisciplineEnums, messages),
    disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
    countryOfBirth: optionalTrimmedString(100),
    importExportStatus: optionalTrimmedString(100),

    // Commercial
    estimatedValue: optionalNumber(messages),
    valueCurrency: optionalCurrency(messages),
    saleStatus: optionalEnum(saleStatusEnums, messages),
    askingPrice: optionalNumber(messages),
    acquisitionDate: z
      .string()
      .refine(
        (value) => {
          if (value.trim() === "") return true;
          const date = new Date(value);
          return !Number.isNaN(date.getTime());
        },
        { message: messages.invalidDate },
      ),
    acquisitionSource: optionalTrimmedString(200),
    showValuePublicly: z.enum(["true", "false"], {
      message: messages.invalidEnum,
    }),

    // Pedigree
    pedigree: pedigreeFormSchema,

    // Media (URLs managed by FileUpload, stored separately)
    description: optionalTrimmedString(2000),
    notes: optionalTrimmedString(5000),

    // Discovery
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
    invalidNumber: t("invalidNumber"),
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
  invalidNumber: "Please enter a valid number",
  contactNameRequired: "Contact name is required when not using owner contact",
  contactPhoneRequired: "Contact phone is required when not using owner contact",
  contactEmailRequired: "Contact email is required when not using owner contact",
  contactEmailInvalid: "Please provide a valid email address",
});

export const createHorseFormSchema = defaultSchemas.createHorseFormSchema;

export type CreateHorseFormValues = z.infer<typeof createHorseFormSchema>;

// --- Edit Horse Form Schema ---

export function editHorseFormSchemas(messages: HorseFormMessages) {
  const editHorseFormSchema = z.object({
    name: requiredTrimmedString(messages),
    breed: requiredEnum(horseBreedEnums, messages),
    sex: requiredEnum(horseSexEnums, messages),
    registeredName: optionalTrimmedString(120),
    registryId: optionalTrimmedString(120),
    microchipId: optionalTrimmedString(120),
    passportNumber: optionalTrimmedString(120),
    color: optionalEnum(horseColorEnums, messages),
    marksDescription: optionalTrimmedString(500),
    heightHands: optionalNumber(messages),
    dateOfBirth: z.string().refine(
      (value) => {
        if (value.trim() === "") return true;
        const date = new Date(value);
        return !Number.isNaN(date.getTime());
      },
      { message: messages.invalidDate },
    ),
    countryOfBirth: optionalTrimmedString(100),
    importExportStatus: optionalTrimmedString(100),
    primaryDiscipline: optionalEnum(horseDisciplineEnums, messages),
    disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
    description: optionalTrimmedString(2000),
    notes: optionalTrimmedString(5000),
    pedigree: z.object({
      sireName: optionalTrimmedString(120),
      sireId: optionalTrimmedString(120),
      damName: optionalTrimmedString(120),
      damId: optionalTrimmedString(120),
      bloodlineNotes: optionalTrimmedString(1000),
    }),
  });

  return { editHorseFormSchema };
}

// --- Sale Form Schema ---

export function saleFormSchemas(messages: HorseFormMessages) {
  const saleFormSchema = z.object({
    saleStatus: z.enum(["not_for_sale", "for_sale"], {
      message: messages.invalidEnum,
    }),
    estimatedValue: optionalNumber(messages),
    valueCurrency: z
      .string()
      .refine(
        (value) =>
          value === "" || (currencyEnums as readonly string[]).includes(value),
        { message: messages.invalidEnum },
      ),
    askingPrice: optionalNumber(messages),
    showValuePublicly: z.enum(["true", "false"], {
      message: messages.invalidEnum,
    }),
    acquisitionDate: z.string().refine(
      (value) => {
        if (value.trim() === "") return true;
        const date = new Date(value);
        return !Number.isNaN(date.getTime());
      },
      { message: messages.invalidDate },
    ),
    acquisitionSource: optionalTrimmedString(200),
  });

  return { saleFormSchema };
}

const defaultEditSchemas = editHorseFormSchemas({
  required: "This field is required",
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
  invalidNumber: "Please enter a valid number",
  contactNameRequired: "Contact name is required when not using owner contact",
  contactPhoneRequired: "Contact phone is required when not using owner contact",
  contactEmailRequired: "Contact email is required when not using owner contact",
  contactEmailInvalid: "Please provide a valid email address",
});

export const editHorseFormSchema = defaultEditSchemas.editHorseFormSchema;
export type EditHorseFormValues = z.infer<typeof editHorseFormSchema>;

const defaultSaleSchemas = saleFormSchemas({
  required: "This field is required",
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
  invalidNumber: "Please enter a valid number",
  contactNameRequired: "Contact name is required when not using owner contact",
  contactPhoneRequired: "Contact phone is required when not using owner contact",
  contactEmailRequired: "Contact email is required when not using owner contact",
  contactEmailInvalid: "Please provide a valid email address",
});

export const saleFormSchema = defaultSaleSchemas.saleFormSchema;
export type SaleFormValues = z.infer<typeof saleFormSchema>;

export const emptyCreateHorseFormValues: CreateHorseFormValues = {
  name: "",
  breed: "",
  sex: "",
  registeredName: "",
  registryId: "",
  microchipId: "",
  passportNumber: "",
  dateOfBirth: "",
  ageYears: "",
  color: "",
  marksDescription: "",
  heightHands: "",
  primaryDiscipline: "",
  disciplines: [],
  countryOfBirth: "",
  importExportStatus: "",
  estimatedValue: "",
  valueCurrency: "",
  saleStatus: "",
  askingPrice: "",
  acquisitionDate: "",
  acquisitionSource: "",
  showValuePublicly: "false",
  pedigree: {
    sireName: "",
    sireId: "",
    damName: "",
    damId: "",
    bloodlineNotes: "",
  },
  description: "",
  notes: "",
  profileVisibility: "public",
  contactDisplay: {
    useOwnerContact: "true",
    name: "",
    phone: "",
    email: "",
  },
};
