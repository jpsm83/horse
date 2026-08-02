/**
 * TransportIdentitySection — company name, description, specialties, and service
 * areas field group for the Transport Profile tab. Receives `control` from the
 * parent deferred form. `serviceAreas` is free-form (comma-separated) text;
 * `specialties` picks one transport specialty enum.
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { transportSpecialtyEnums } from "@/utils/enums.ts";
import type { TransportProfileFormValues } from "@/lib/validations/transportForms.ts";

type TransportIdentitySectionProps = {
  control: Control<TransportProfileFormValues>;
};

export function TransportIdentitySection({ control }: TransportIdentitySectionProps) {
  const t = useTranslations("transport.profile");

  const specialtyOptions = transportSpecialtyEnums.map((value) => ({ value, label: value }));

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="companyName"
          id="transport-companyName"
          label={t("companyName")}
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="transport-description">{t("description")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="transport-description"
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
            name="specialties"
            control={control}
            render={({ field, fieldState }) => (
              <SelectField
                id="transport-specialties"
                label={t("specialties")}
                value={Array.isArray(field.value) ? field.value[0] ?? "" : ""}
                onChange={(value) => field.onChange(value ? [value] : [])}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={specialtyOptions}
              />
            )}
          />
          <Controller
            name="serviceAreas"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="transport-serviceAreas">
                  {t("serviceAreas")}
                </FieldLabel>
                <Input
                  id="transport-serviceAreas"
                  value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    )
                  }
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
