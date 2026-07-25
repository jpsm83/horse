/**
 * Maps between API user fields and preferences form values / PATCH payloads.
 */

import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { PreferencesFormValues } from "@/lib/validations/preferencesForms.ts";
import type { UpdatePersonalDetailsInput } from "@/lib/services/userService.ts";
import { normalizeLocale, type AppLocale } from "@/i18n/resolveLocale.ts";
import { normalizeTheme } from "@/lib/theme/appTheme.ts";
import { emptyPreferencesFormValues } from "@/lib/validations/preferencesForms.ts";

function readString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim() === "null" ? "" : value;
}

/** Map API personalDetails + preferences to form defaults. */
export function mapUserToPreferencesFormValues(
  personalDetails: Record<string, unknown> | undefined,
  preferences?: Record<string, unknown>,
): PreferencesFormValues {
  if (!personalDetails) {
    return { ...emptyPreferencesFormValues };
  }

  return {
    preferredTheme: normalizeTheme(readString(personalDetails.preferredTheme)),
    preferredLanguage: normalizeLocale(readString(personalDetails.preferredLanguage)),
    allowDirectMessagesFrom: (readString(preferences?.allowDirectMessagesFrom) ||
      "everyone") as PreferencesFormValues["allowDirectMessagesFrom"],
  };
}

type PreferencesDirtyFields = Partial<FieldNamesMarkedBoolean<PreferencesFormValues>>;

/**
 * Build a PATCH from dirty preference fields only.
 */
export function mapPreferencesFormValuesToPatch(
  values: PreferencesFormValues,
  dirtyFields: PreferencesDirtyFields,
): UpdatePersonalDetailsInput {
  const patch: UpdatePersonalDetailsInput = {};

  if (dirtyFields.preferredLanguage) {
    patch.preferredLanguage = normalizeLocale(values.preferredLanguage) as AppLocale;
  }

  if (dirtyFields.preferredTheme) {
    patch.preferredTheme = normalizeTheme(values.preferredTheme);
  }

  if (dirtyFields.allowDirectMessagesFrom) {
    patch.preferences = {
      allowDirectMessagesFrom: values.allowDirectMessagesFrom,
    };
  }

  return patch;
}
