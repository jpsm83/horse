"use client";

/**
 * Horse profile About section — disciplines multi-select + description.
 * Used by the horse profile tab form.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";

import { HorseMultiSelectField } from "@/components/horses/shared/horse-multi-select-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileFormValues } from "@/lib/validations/horseForms.ts";
import { horseDisciplineEnums } from "@/utils/enums.ts";

type HorseAboutSectionProps = {
  control: Control<ProfileFormValues>;
};

export function HorseAboutSection({ control }: HorseAboutSectionProps) {
  const t = useTranslations("horseProfile");
  const tCommon = useTranslations("common");

  const multiDisciplineOptions = useMemo(
    () => horseDisciplineEnums.map((v) => ({ value: v, label: t(`disciplineOptions.${v}`) })),
    [t],
  );

  return (
    <FieldGroup className="flex flex-col sm:flex-row gap-4">
      <div className="w-1/3">
      <Controller
        name="disciplines"
        control={control}
        render={({ field, fieldState }) => (
          <HorseMultiSelectField
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
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="profile-description">{t("description")}</FieldLabel>
            <Textarea
              {...field}
              value={field.value ?? ""}
              id="profile-description"
              rows={4}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
