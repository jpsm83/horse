/**
 * UserIdentificationSection — Identification field group for the Profile tab.
 * Nationality, phone number, ID type, and ID number. Receives `control` from the
 * parent deferred form (horse §6.5 pattern). Layer-2 `identification` mode gates
 * the matching hub section.
 */

"use client";

import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { FlagSelectField, SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { getCountrySelectOptions } from "@/lib/profile/selectOptions.ts";
import type { ProfileFormValues } from "@/lib/validations/profileForms.ts";
import { idTypeEnums } from "@/utils/enums.ts";

const ID_TYPE_TRANSLATION_KEYS: Record<(typeof idTypeEnums)[number], string> = {
  Passport: "passport",
  "National ID": "nationalId",
  "Driver License": "driverLicense",
  "Tax ID": "taxId",
  Other: "other",
};

type UserIdentificationSectionProps = {
  control: Control<ProfileFormValues>;
};

export function UserIdentificationSection({
  control,
}: UserIdentificationSectionProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;

  const countryOptions = useMemo(() => getCountrySelectOptions(locale), [locale]);

  const idTypeOptions = useMemo(
    () =>
      idTypeEnums.map((value) => ({
        value,
        label: t(`idTypeOptions.${ID_TYPE_TRANSLATION_KEYS[value]}`),
      })),
    [t],
  );

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Controller
        name="nationality"
        control={control}
        render={({ field, fieldState }) => (
          <FlagSelectField
            id="profile-nationality"
            label={t("nationality")}
            placeholder={tCommon("selectPlaceholder")}
            value={field.value}
            onChange={field.onChange}
            invalid={fieldState.invalid}
            error={fieldState.error}
            options={countryOptions}
          />
        )}
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="profile-phoneNumber"
        label={t("phoneNumber")}
        type="tel"
        autoComplete="tel"
      />
      <Controller
        name="idType"
        control={control}
        render={({ field, fieldState }) => (
          <SelectField
            id="profile-idType"
            label={t("idType")}
            placeholder={tCommon("selectPlaceholder")}
            value={field.value}
            onChange={field.onChange}
            invalid={fieldState.invalid}
            error={fieldState.error}
            options={idTypeOptions}
          />
        )}
      />
      <TextField
        control={control}
        name="idNumber"
        id="profile-idNumber"
        label={t("idNumber")}
      />
    </div>
  );
}
