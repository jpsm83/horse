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
import { isValidCountryCode } from "../data/countries.ts";
import {
  hasAtLeastOneHorseIdentity,
  HORSE_IDENTITY_REQUIRED_MESSAGE,
} from "../utils/horseIdentity.ts";

export type HorseFormMessages = {
  required: string;
  invalidDate: string;
  invalidEnum: string;
  invalidNumber: string;
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
  const pedigreeFormSchema = z.object({
    sireName: optionalTrimmedString(120),
    damName: optionalTrimmedString(120),
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
    color: optionalEnum(horseColorEnums, messages),
    heightHands: optionalNumber(messages),
    primaryDiscipline: optionalEnum(horseDisciplineEnums, messages),
    disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
    countryOfBirth: z.string().refine((v): boolean => isValidCountryCode(v), { message: "Invalid country code" }),
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

    // Discovery
    profileVisibility: z.enum(visibilityEnums, {
      message: messages.invalidEnum,
    }),
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
  };
}

const defaultSchemas = createHorseFormSchemas({
  required: "This field is required",
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
  invalidNumber: "Please enter a valid number",
});

export const createHorseFormSchema = defaultSchemas.createHorseFormSchema;

export type CreateHorseFormValues = z.infer<typeof createHorseFormSchema>;

// --- Profile Horse Form Schemas ---

export function profileFormSchemas(messages: HorseFormMessages) {
  const pedigreeFormSchema = z.object({
    sireName: optionalTrimmedString(120),
    damName: optionalTrimmedString(120),
    bloodlineNotes: optionalTrimmedString(1000),
  });

  const identityFormSchema = z.object({
    name: requiredTrimmedString(messages),
    breed: requiredEnum(horseBreedEnums, messages),
    sex: requiredEnum(horseSexEnums, messages),
    color: optionalEnum(horseColorEnums, messages),
    heightHands: optionalNumber(messages),
    dateOfBirth: z.string().refine(
      (value) => {
        if (value.trim() === "") return true;
        const date = new Date(value);
        return !Number.isNaN(date.getTime());
      },
      { message: messages.invalidDate },
    ),
    countryOfBirth: z.string().refine((v): boolean => isValidCountryCode(v), { message: "Invalid country code" }),
  });

  const identificationFormSchema = z.object({
    registeredName: optionalTrimmedString(120),
    registryId: optionalTrimmedString(120),
    microchipId: optionalTrimmedString(120),
    passportNumber: optionalTrimmedString(120),
  });

  const disciplinesFormSchema = z.object({
    primaryDiscipline: optionalEnum(horseDisciplineEnums, messages),
    disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
  });

  const aboutFormSchema = z.object({
    description: optionalTrimmedString(2000),
  });

  const pedigreeSectionFormSchema = z.object({
    pedigree: pedigreeFormSchema,
  });

  const discoveryFormSchema = z.object({
    profileVisibility: z.enum(visibilityEnums, {
      message: messages.invalidEnum,
    }),
  });

  // Zod v4: do not .merge() schemas that include field/object refinements.
  // Compose via shape instead, then attach identity refine once.
  const profileFormSchema = z
    .object({
      ...identityFormSchema.shape,
      ...identificationFormSchema.shape,
      ...disciplinesFormSchema.shape,
      ...aboutFormSchema.shape,
      ...pedigreeSectionFormSchema.shape,
    })
    .superRefine((data, ctx) => {
      if (!hasAtLeastOneHorseIdentity(data)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: HORSE_IDENTITY_REQUIRED_MESSAGE,
          path: ["registryId"],
        });
      }
    });

  const identificationFormSchemaWithIdentity = identificationFormSchema.superRefine(
    (data, ctx) => {
      if (!hasAtLeastOneHorseIdentity(data)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: HORSE_IDENTITY_REQUIRED_MESSAGE,
          path: ["registryId"],
        });
      }
    },
  );

  return {
    identityFormSchema,
    identificationFormSchema: identificationFormSchemaWithIdentity,
    disciplinesFormSchema,
    aboutFormSchema,
    pedigreeSectionFormSchema,
    discoveryFormSchema,
    profileFormSchema,
  };
}

/** @deprecated Use profileFormSchemas */
export function editHorseFormSchemas(messages: HorseFormMessages) {
  const { profileFormSchema } = profileFormSchemas(messages);
  return { editHorseFormSchema: profileFormSchema };
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

const defaultProfileSchemas = profileFormSchemas({
  required: "This field is required",
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
  invalidNumber: "Please enter a valid number",
});

export const identityFormSchema = defaultProfileSchemas.identityFormSchema;
export const identificationFormSchema = defaultProfileSchemas.identificationFormSchema;
export const disciplinesFormSchema = defaultProfileSchemas.disciplinesFormSchema;
export const aboutFormSchema = defaultProfileSchemas.aboutFormSchema;
export const pedigreeSectionFormSchema = defaultProfileSchemas.pedigreeSectionFormSchema;
export const discoveryFormSchema = defaultProfileSchemas.discoveryFormSchema;
export const profileFormSchema = defaultProfileSchemas.profileFormSchema;

export type IdentityFormValues = z.infer<typeof identityFormSchema>;
export type IdentificationFormValues = z.infer<typeof identificationFormSchema>;
export type DisciplinesFormValues = z.infer<typeof disciplinesFormSchema>;
export type AboutFormValues = z.infer<typeof aboutFormSchema>;
export type PedigreeSectionFormValues = z.infer<typeof pedigreeSectionFormSchema>;
export type DiscoveryFormValues = z.infer<typeof discoveryFormSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultEditSchemas = editHorseFormSchemas({
  required: "This field is required",
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
  invalidNumber: "Please enter a valid number",
});

export const editHorseFormSchema = defaultEditSchemas.editHorseFormSchema;
export type EditHorseFormValues = z.infer<typeof editHorseFormSchema>;

const defaultSaleSchemas = saleFormSchemas({
  required: "This field is required",
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
  invalidNumber: "Please enter a valid number",
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
  color: "",
  heightHands: "",
  primaryDiscipline: "",
  disciplines: [],
  countryOfBirth: "",
  estimatedValue: "",
  valueCurrency: "",
  saleStatus: "",
  askingPrice: "",
  acquisitionDate: "",
  acquisitionSource: "",
  showValuePublicly: "false",
  pedigree: {
    sireName: "",
    damName: "",
    bloodlineNotes: "",
  },
  description: "",
  profileVisibility: "public",
};
