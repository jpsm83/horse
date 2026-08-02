/**
 * CoachIdentitySection — display name, bio, disciplines, competition levels,
 * preparation services, and experience years field group for the Coach Profile
 * tab. Receives `control` from the parent deferred form.
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { horseDisciplineEnums } from "@/utils/enums.ts";
import type { CoachProfileFormValues } from "@/lib/validations/coachForms.ts";

type CoachIdentitySectionProps = {
  control: Control<CoachProfileFormValues>;
};

export function CoachIdentitySection({ control }: CoachIdentitySectionProps) {
  const t = useTranslations("coach.profile");

  const disciplineOptions = horseDisciplineEnums.map((value) => ({ value, label: value }));

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="displayName"
          id="coach-displayName"
          label={t("displayName")}
        />
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="coach-bio">{t("bio")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="coach-bio"
                rows={4}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        <Controller
          name="disciplines"
          control={control}
          render={({ field, fieldState }) => (
            <SelectField
              id="coach-disciplines"
              label={t("disciplines")}
              value={Array.isArray(field.value) ? field.value[0] ?? "" : ""}
              onChange={(value) => field.onChange(value ? [value] : [])}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={disciplineOptions}
            />
          )}
        />
        <TextField
          control={control}
          name="competitionLevels"
          id="coach-competitionLevels"
          label={t("competitionLevels")}
        />
        <TextField
          control={control}
          name="preparationServices"
          id="coach-preparationServices"
          label={t("preparationServices")}
        />
        <TextField
          control={control}
          name="experienceYears"
          id="coach-experienceYears"
          label={t("experienceYears")}
          type="number"
        />
      </FieldGroup>
    </div>
  );
}
