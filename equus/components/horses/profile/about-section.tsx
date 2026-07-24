"use client";

import { useTranslations } from "next-intl";
import { Controller, type Control } from "react-hook-form";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileFormValues } from "@/lib/validations/horseForms.ts";

type AboutSectionProps = {
  control: Control<ProfileFormValues>;
};

export function AboutSection({ control }: AboutSectionProps) {
  const t = useTranslations("horseProfile");

  return (
    <FieldGroup>
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
