/**
 * BreederIdentitySection — operation name, description, disciplines, and
 * bloodlines field group for the Breeder Profile tab. Receives `control` from
 * the parent deferred form (horse §6.5 pattern). Bloodlines is a free-text
 * comma-separated input; the update hook splits it into an array.
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
import type { BreederProfileFormValues } from "@/lib/validations/breederForms.ts";

type BreederIdentitySectionProps = {
  control: Control<BreederProfileFormValues>;
};

export function BreederIdentitySection({ control }: BreederIdentitySectionProps) {
  const t = useTranslations("breeder.profile");

  const disciplineOptions = horseDisciplineEnums.map((value) => ({ value, label: value }));

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="operationName"
          id="breeder-operationName"
          label={t("operationName")}
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="breeder-description">{t("description")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="breeder-description"
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
          <Controller
            name="disciplines"
            control={control}
            render={({ field, fieldState }) => (
              <SelectField
                id="breeder-disciplines"
                label={t("disciplines")}
                value={Array.isArray(field.value) ? field.value[0] ?? "" : ""}
                onChange={(value) => field.onChange(value ? [value] : [])}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={disciplineOptions}
              />
            )}
          />
          <Controller
            name="bloodlines"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="breeder-bloodlines">{t("bloodlines")}</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="breeder-bloodlines"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
