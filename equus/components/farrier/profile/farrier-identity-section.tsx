/**
 * FarrierIdentitySection — display name, bio, experience, and service area field
 * group for the Farrier Profile tab. Receives `control` from the parent deferred
 * form (horse §6.5 pattern).
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { FarrierProfileFormValues } from "@/lib/validations/farrierForms.ts";

type FarrierIdentitySectionProps = {
  control: Control<FarrierProfileFormValues>;
};

export function FarrierIdentitySection({ control }: FarrierIdentitySectionProps) {
  const t = useTranslations("farrier.profile");

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="displayName"
          id="farrier-displayName"
          label={t("displayName")}
        />
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="farrier-bio">{t("bio")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="farrier-bio"
                rows={4}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            control={control}
            name="experienceYears"
            id="farrier-experienceYears"
            label={t("experienceYears")}
            type="number"
          />
          <TextField
            control={control}
            name="serviceAreaKm"
            id="farrier-serviceAreaKm"
            label={t("serviceAreaKm")}
            type="number"
          />
        </div>
      </FieldGroup>
    </div>
  );
}
