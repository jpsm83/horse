/**
 * RiderIdentitySection — display name, bio, disciplines, experience years, and
 * competition highlights field group for the Rider Profile tab. Receives
 * `control` from the parent deferred form.
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { horseDisciplineEnums } from "@/utils/enums.ts";
import type { RiderProfileFormValues } from "@/lib/validations/riderForms.ts";

type RiderIdentitySectionProps = {
  control: Control<RiderProfileFormValues>;
};

export function RiderIdentitySection({ control }: RiderIdentitySectionProps) {
  const t = useTranslations("rider.profile");

  const disciplineOptions = horseDisciplineEnums.map((value) => ({ value, label: value }));

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="displayName"
          id="rider-displayName"
          label={t("displayName")}
        />
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="rider-bio">{t("bio")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="rider-bio"
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
              id="rider-disciplines"
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
          name="experienceYears"
          id="rider-experienceYears"
          label={t("experienceYears")}
          type="number"
        />
        <TextField
          control={control}
          name="competitionHighlights"
          id="rider-competitionHighlights"
          label={t("competitionHighlights")}
        />
      </FieldGroup>
    </div>
  );
}
