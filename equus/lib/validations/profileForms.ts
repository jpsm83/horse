/**
 * Client-side Zod schema for the profile edit form.
 * Empty strings are allowed — cleared optional fields are sent as `""` on save.
 */

import { z } from "zod";
import {
  appLocaleEnums,
  genderEnums,
  idTypeEnums,
  userDirectMessageAudienceEnums,
  userProfileVisibilityEnums,
} from "../../utils/enums.ts";
import { isKnownCountryCode } from "../data/countries.ts";

export type ProfileFormMessages = {
  invalidDate: string;
  invalidEnum: string;
};

function optionalTrimmedString(max?: number) {
  let schema = z.string().trim();
  if (max !== undefined) {
    schema = schema.max(max);
  }
  return schema;
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
    .trim()
    .toUpperCase()
    .refine((value) => value === "" || isKnownCountryCode(value), {
      message: messages.invalidEnum,
    });
}

export function createProfileFormSchemas(messages: ProfileFormMessages) {
  const addressFormSchema = z.object({
    country: optionalCountryCode(messages),
    state: optionalTrimmedString(),
    city: optionalTrimmedString(),
    street: optionalTrimmedString(),
    buildingNumber: optionalTrimmedString(),
    doorNumber: optionalTrimmedString(),
    complement: optionalTrimmedString(),
    postCode: optionalTrimmedString(),
    region: optionalTrimmedString(),
    additionalDetails: optionalTrimmedString(),
  });

  const profileFormSchema = z.object({
    username: optionalTrimmedString(50),
    preferredLanguage: z.enum(appLocaleEnums, { message: messages.invalidEnum }),
    firstName: optionalTrimmedString(50),
    lastName: optionalTrimmedString(50),
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
    phoneNumber: optionalTrimmedString(),
    bio: optionalTrimmedString(2000),
    idType: optionalEnum(idTypeEnums, messages),
    idNumber: optionalTrimmedString(),
    profileVisibility: z.enum(userProfileVisibilityEnums, {
      message: messages.invalidEnum,
    }),
    searchable: z.enum(["true", "false"], {
      message: messages.invalidEnum,
    }),
    allowDirectMessagesFrom: z.enum(userDirectMessageAudienceEnums, {
      message: messages.invalidEnum,
    }),
    address: addressFormSchema,
  });

  return { profileFormSchema };
}

export function profileFormMessagesFromTranslations(
  t: (key: string) => string,
): ProfileFormMessages {
  return {
    invalidDate: t("invalidDate"),
    invalidEnum: t("invalidEnum"),
  };
}

const defaultSchemas = createProfileFormSchemas({
  invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option",
});

export const profileFormSchema = defaultSchemas.profileFormSchema;

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const emptyProfileFormValues: ProfileFormValues = {
  username: "",
  preferredLanguage: "en",
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  nationality: "",
  phoneNumber: "",
  bio: "",
  idType: "",
  idNumber: "",
  profileVisibility: "public",
  searchable: "true",
  allowDirectMessagesFrom: "everyone",
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
  },
};
