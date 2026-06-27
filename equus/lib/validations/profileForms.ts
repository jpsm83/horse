/**
 * Client-side Zod schemas for the profile edit form.
 * Partial saves: fields are optional; formats are validated when provided.
 */

import { z } from "zod";
import { appLocaleEnums, genderEnums, idTypeEnums } from "../../utils/enums.ts";
import { isKnownCountryCode } from "../data/countries.ts";

export type ProfileFormMessages = {
  fieldRequired: string;
  invalidDate: string;
  invalidEnum: string;
  invalidCoordinates: string;
  addressFieldRequired: string;
};

function optionalTrimmedString(max?: number) {
  return z
    .string()
    .transform((value) => value.trim())
    .pipe(max ? z.string().max(max) : z.string());
}

function optionalNonEmptyString(messages: ProfileFormMessages, max?: number) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value === "" || value.length >= 1, messages.fieldRequired)
    .pipe(max ? z.string().max(max) : z.string());
}

function optionalEnum<T extends readonly [string, ...string[]]>(
  values: T,
  messages: ProfileFormMessages,
) {
  return z
    .string()
    .refine((value) => value === "" || (values as readonly string[]).includes(value), {
      message: messages.invalidEnum,
    });
}

function optionalCountryCode(messages: ProfileFormMessages) {
  return z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value === "" || isKnownCountryCode(value), {
      message: messages.invalidEnum,
    });
}

export function createProfileFormSchemas(messages: ProfileFormMessages) {
  const addressFormSchema = z
    .object({
      country: optionalCountryCode(messages),
      state: optionalNonEmptyString(messages),
      city: optionalNonEmptyString(messages),
      street: optionalNonEmptyString(messages),
      buildingNumber: optionalNonEmptyString(messages),
      doorNumber: optionalTrimmedString(),
      complement: optionalTrimmedString(),
      postCode: optionalNonEmptyString(messages),
      region: optionalTrimmedString(),
      additionalDetails: optionalTrimmedString(),
      longitude: z.string(),
      latitude: z.string(),
    })
    .superRefine((address, ctx) => {
      const textFields = [
        "country",
        "state",
        "city",
        "street",
        "buildingNumber",
        "postCode",
      ] as const;
      const hasAnyText = textFields.some((key) => address[key].trim() !== "");
      const hasCoords =
        address.longitude.trim() !== "" || address.latitude.trim() !== "";

      if (!hasAnyText && !hasCoords) {
        return;
      }

      for (const key of textFields) {
        if (address[key].trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: messages.addressFieldRequired,
            path: [key],
          });
        }
      }

      const lon = address.longitude.trim();
      const lat = address.latitude.trim();
      if (lon !== "" || lat !== "") {
        const lonNum = Number(lon);
        const latNum = Number(lat);
        if (lon === "" || lat === "" || Number.isNaN(lonNum) || Number.isNaN(latNum)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: messages.invalidCoordinates,
            path: ["longitude"],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: messages.invalidCoordinates,
            path: ["latitude"],
          });
        }
      }
    });

  const profileFormSchema = z.object({
    username: optionalNonEmptyString(messages, 50),
    preferredLanguage: z.enum(appLocaleEnums, { message: messages.invalidEnum }),
    timezone: optionalNonEmptyString(messages),
    firstName: optionalNonEmptyString(messages, 50),
    lastName: optionalNonEmptyString(messages, 50),
    gender: optionalEnum(genderEnums, messages),
    birthDate: z
      .string()
      .refine(
        (value) => {
          if (value.trim() === "") return true;
          const date = new Date(value);
          return !Number.isNaN(date.getTime());
        },
        { message: messages.invalidDate },
      ),
    nationality: optionalCountryCode(messages),
    phoneNumber: optionalNonEmptyString(messages),
    bio: optionalTrimmedString(2000),
    idType: optionalEnum(idTypeEnums, messages),
    idNumber: optionalNonEmptyString(messages),
    address: addressFormSchema,
  });

  return { profileFormSchema };
}

export function profileFormMessagesFromTranslations(
  t: (key: string) => string,
): ProfileFormMessages {
  return {
    fieldRequired: t("fieldRequired"),
    invalidDate: t("invalidDate"),
    invalidEnum: t("invalidEnum"),
    invalidCoordinates: t("invalidCoordinates"),
    addressFieldRequired: t("addressFieldRequired"),
  };
}

const defaultMessages: ProfileFormMessages = {
  fieldRequired: "This field cannot be empty when provided",
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
  invalidCoordinates: "Please enter valid longitude and latitude",
  addressFieldRequired: "This address field is required when address is provided",
};

const defaultSchemas = createProfileFormSchemas(defaultMessages);

export const profileFormSchema = defaultSchemas.profileFormSchema;

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const emptyProfileFormValues: ProfileFormValues = {
  username: "",
  preferredLanguage: "en",
  timezone: "",
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  nationality: "",
  phoneNumber: "",
  bio: "",
  idType: "",
  idNumber: "",
  address: {
    country: "",
    state: "",
    city: "",
    street: "",
    buildingNumber: "",
    doorNumber: "",
    complement: "",
    postCode: "",
    region: "",
    additionalDetails: "",
    longitude: "",
    latitude: "",
  },
};
