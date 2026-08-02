/**
 * GroomIdentitySection — display name, bio, specialties, and experience field
 * group for the Groom Profile tab. Receives `control` from the parent deferred
 * form (horse §6.5 pattern). Specialties are edited as comma-separated text.
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { GroomProfileFormValues } from "@/lib/validations/groomForms.ts";

type GroomIdentitySectionProps = {
  control: Control<GroomProfileFormValues>;
};

export function GroomIdentitySection({ control }: GroomIdentitySectionProps) {
  const t = useTranslations("groom.profile");

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="displayName"
          id="groom-displayName"
          label={t("displayName")}
        />
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="groom-bio">{t("bio")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="groom-bio"
                rows={4}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        <TextField
          control={control}
          name="specialties"
          id="groom-specialties"
          label={t("specialties")}
        />
        <TextField
          control={control}
          name="experienceYears"
          id="groom-experienceYears"
          label={t("experienceYears")}
          type="number"
        />
      </FieldGroup>
    </div>
  );
}
