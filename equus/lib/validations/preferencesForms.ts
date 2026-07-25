/**
 * Client-side Zod schema for the preferences form
 * (theme, language, DM audience).
 * Profile visibility (Layer-1) has moved to the Profile tab.
 */

import { z } from "zod";
import {
  appLocaleEnums,
  appThemeEnums,
  userDirectMessageAudienceEnums,
} from "../../utils/enums.ts";

export type PreferencesFormMessages = {
  invalidEnum: string;
};

export function createPreferencesFormSchemas(messages: PreferencesFormMessages) {
  const preferencesFormSchema = z.object({
    preferredTheme: z.enum(appThemeEnums, { message: messages.invalidEnum }),
    preferredLanguage: z.enum(appLocaleEnums, { message: messages.invalidEnum }),
    allowDirectMessagesFrom: z.enum(userDirectMessageAudienceEnums, {
      message: messages.invalidEnum,
    }),
  });

  return { preferencesFormSchema };
}

export function preferencesFormMessagesFromTranslations(
  t: (key: string) => string,
): PreferencesFormMessages {
  return {
    invalidEnum: t("invalidEnum"),
  };
}

const defaultSchemas = createPreferencesFormSchemas({
  invalidEnum: "Please select a valid option",
});

export const preferencesFormSchema = defaultSchemas.preferencesFormSchema;

export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

export const emptyPreferencesFormValues: PreferencesFormValues = {
  preferredTheme: "default",
  preferredLanguage: "en",
  allowDirectMessagesFrom: "everyone",
};
