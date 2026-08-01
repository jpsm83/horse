/**
 * UserAccountTypeSection — account-type field group for the Profile Account section.
 * `userType` (individual/business) + business details. Bound to the parent
 * deferred form (saved with the main Save button).
 */

"use client";

import { useMemo } from "react";
import { Controller, useWatch, type Control } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { FlagSelectField, SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { getCountrySelectOptions } from "@/lib/profile/selectOptions.ts";
import type { ProfileFormValues } from "@/lib/validations/profileForms.ts";

type UserAccountTypeSectionProps = {
  control: Control<ProfileFormValues>;
};

export function UserAccountTypeSection({ control }: UserAccountTypeSectionProps) {
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const userType = useWatch({ control, name: "userType" });

  const countryOptions = useMemo(() => getCountrySelectOptions(locale), [locale]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          name="userType"
          control={control}
          render={({ field, fieldState }) => (
            <SelectField
              id="profile-userType"
              label={tCommon("accountType")}
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={[
                { value: "individual", label: tCommon("individual") },
                { value: "business", label: tCommon("business") },
              ]}
            />
          )}
        />
      </div>

      {userType === "business" ? (
        <FieldGroup className="mt-4 space-y-4 rounded-lg border p-4">
          <p className="text-sm font-medium">{tCommon("businessDetails")}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={control}
              name="businessDetails.businessName"
              id="profile-businessName"
              label={tCommon("businessName")}
            />
            <TextField
              control={control}
              name="businessDetails.registrationNumber"
              id="profile-registrationNumber"
              label={tCommon("registrationNumber")}
            />
            <TextField
              control={control}
              name="businessDetails.taxId"
              id="profile-taxId"
              label={tCommon("taxId")}
            />
            <Controller
              name="businessDetails.countryOfRegistration"
              control={control}
              render={({ field, fieldState }) => (
                <FlagSelectField
                  id="profile-countryOfRegistration"
                  label={tCommon("countryOfRegistration")}
                  placeholder={tCommon("selectPlaceholder")}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={countryOptions}
                />
              )}
            />
          </div>
        </FieldGroup>
      ) : null}
    </div>
  );
}
