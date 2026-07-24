"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";

import { TextField } from "@/components/forms/text-field.tsx";
import { HorseProfileSelectField } from "@/components/horses/profile/horse-profile-select-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { ProfileFormValues } from "@/lib/validations/horseForms.ts";
import {
  horseBreedEnums,
  horseColorEnums,
  horseSexEnums,
} from "@/utils/enums.ts";

type IdentitySectionProps = {
  control: Control<ProfileFormValues>;
};

export function IdentitySection({ control }: IdentitySectionProps) {
  const t = useTranslations("horseProfile");
  const tCommon = useTranslations("common");

  const sexOptions = useMemo(
    () => horseSexEnums.map((v) => ({ value: v, label: t(`sexOptions.${v}`) })),
    [t],
  );
  const breedOptions = useMemo(
    () => horseBreedEnums.map((v) => ({ value: v, label: t(`breedOptions.${v}`) })),
    [t],
  );
  const colorOptions = useMemo(
    () => [
      { value: "", label: tCommon("selectPlaceholder") },
      ...horseColorEnums.map((v) => ({ value: v, label: t(`colorOptions.${v}`) })),
    ],
    [t, tCommon],
  );

  return (
    <FieldGroup>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField control={control} name="name" id="profile-name" label={t("name")} />
        <Controller
          name="breed"
          control={control}
          render={({ field, fieldState }) => (
            <HorseProfileSelectField
              id="profile-breed"
              label={t("breed")}
              placeholder={tCommon("selectPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={breedOptions}
            />
          )}
        />
        <Controller
          name="sex"
          control={control}
          render={({ field, fieldState }) => (
            <HorseProfileSelectField
              id="profile-sex"
              label={t("sex")}
              placeholder={tCommon("selectPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={sexOptions}
            />
          )}
        />
        <Controller
          name="color"
          control={control}
          render={({ field, fieldState }) => (
            <HorseProfileSelectField
              id="profile-color"
              label={t("color")}
              placeholder={tCommon("selectPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={colorOptions}
            />
          )}
        />
        <TextField
          control={control}
          name="heightHands"
          id="profile-heightHands"
          label={t("heightHands")}
          type="number"
        />
        <TextField
          control={control}
          name="dateOfBirth"
          id="profile-dateOfBirth"
          label={t("dateOfBirth")}
          type="date"
        />
        <TextField
          control={control}
          name="ageYears"
          id="profile-ageYears"
          label={t("ageYears")}
          type="number"
        />
        <TextField
          control={control}
          name="marksDescription"
          id="profile-marksDescription"
          label={t("marksDescription")}
        />
        <TextField
          control={control}
          name="countryOfBirth"
          id="profile-countryOfBirth"
          label={t("countryOfBirth")}
        />
      </div>
    </FieldGroup>
  );
}
