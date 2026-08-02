/**
 * TrainerIdentitySection — display name, bio, specialties, and experience years
 * field group for the Trainer Profile tab. Receives `control` from the parent
 * deferred form. `specialties` picks one discipline enum.
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { horseDisciplineEnums } from "@/utils/enums.ts";
import type { TrainerProfileFormValues } from "@/lib/validations/trainerForms.ts";

type TrainerIdentitySectionProps = {
  control: Control<TrainerProfileFormValues>;
};

export function TrainerIdentitySection({ control }: TrainerIdentitySectionProps) {
  const t = useTranslations("trainer.profile");

  const disciplineOptions = horseDisciplineEnums.map((value) => ({ value, label: value }));

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="displayName"
          id="trainer-displayName"
          label={t("displayName")}
        />
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="trainer-bio">{t("bio")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="trainer-bio"
                rows={4}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            name="specialties"
            control={control}
            render={({ field, fieldState }) => (
              <SelectField
                id="trainer-specialties"
                label={t("specialties")}
                value={Array.isArray(field.value) ? field.value[0] ?? "" : ""}
                onChange={(value) => field.onChange(value ? [value] : [])}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={disciplineOptions}
              />
            )}
          />
          <Controller
            name="experienceYears"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="trainer-experienceYears">
                  {t("experienceYears")}
                </FieldLabel>
                <Input
                  {...field}
                  id="trainer-experienceYears"
                  type="number"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? undefined : Number(event.target.value),
                    )
                  }
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
