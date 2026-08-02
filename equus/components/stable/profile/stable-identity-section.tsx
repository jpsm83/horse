/**
 * StableIdentitySection — trade name, description, disciplines, and services
 * field group for the Stable Profile tab. Receives `control` from the parent
 * deferred form (horse §6.5 pattern).
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { horseDisciplineEnums, stableServiceEnums } from "@/utils/enums.ts";
import type { StableProfileFormValues } from "@/lib/validations/stableForms.ts";

type StableIdentitySectionProps = {
  control: Control<StableProfileFormValues>;
};

export function StableIdentitySection({ control }: StableIdentitySectionProps) {
  const t = useTranslations("stable.profile");

  const disciplineOptions = horseDisciplineEnums.map((value) => ({ value, label: value }));
  const serviceOptions = stableServiceEnums.map((value) => ({ value, label: value }));

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="tradeName"
          id="stable-tradeName"
          label={t("tradeName")}
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="stable-description">{t("description")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="stable-description"
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
                id="stable-disciplines"
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
            name="services"
            control={control}
            render={({ field, fieldState }) => (
              <SelectField
                id="stable-services"
                label={t("services")}
                value={Array.isArray(field.value) ? field.value[0] ?? "" : ""}
                onChange={(value) => field.onChange(value ? [value] : [])}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={serviceOptions}
              />
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
