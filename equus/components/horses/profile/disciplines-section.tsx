"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";

import { HorseProfileMultiSelectField } from "@/components/horses/profile/horse-profile-multi-select-field.tsx";
import { HorseProfileSelectField } from "@/components/horses/profile/horse-profile-select-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { ProfileFormValues } from "@/lib/validations/horseForms.ts";
import { horseDisciplineEnums } from "@/utils/enums.ts";

type DisciplinesSectionProps = {
  control: Control<ProfileFormValues>;
};

export function DisciplinesSection({ control }: DisciplinesSectionProps) {
  const t = useTranslations("horseProfile");
  const tCommon = useTranslations("common");

  const disciplineOptions = useMemo(
    () => [
      { value: "", label: tCommon("selectPlaceholder") },
      ...horseDisciplineEnums.map((v) => ({ value: v, label: t(`disciplineOptions.${v}`) })),
    ],
    [t, tCommon],
  );

  const multiDisciplineOptions = useMemo(
    () => horseDisciplineEnums.map((v) => ({ value: v, label: t(`disciplineOptions.${v}`) })),
    [t],
  );

  return (
    <FieldGroup>
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          name="primaryDiscipline"
          control={control}
          render={({ field, fieldState }) => (
            <HorseProfileSelectField
              id="profile-primaryDiscipline"
              label={t("primaryDiscipline")}
              placeholder={tCommon("selectPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={disciplineOptions}
            />
          )}
        />
        <Controller
          name="disciplines"
          control={control}
          render={({ field, fieldState }) => (
            <HorseProfileMultiSelectField
              id="profile-disciplines"
              label={t("disciplines")}
              value={field.value ?? []}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={multiDisciplineOptions}
              placeholder={tCommon("selectPlaceholder")}
            />
          )}
        />
      </div>
    </FieldGroup>
  );
}
