/**
 * VeterinaryIdentitySection — practice name, description, emergency phone,
 * service area, and emergency availability field group for the Veterinary
 * Profile tab. Receives `control` from the parent deferred form.
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch.tsx";
import { Textarea } from "@/components/ui/textarea";
import type { VeterinaryProfileFormValues } from "@/lib/validations/veterinaryForms.ts";

type VeterinaryIdentitySectionProps = {
  control: Control<VeterinaryProfileFormValues>;
};

export function VeterinaryIdentitySection({ control }: VeterinaryIdentitySectionProps) {
  const t = useTranslations("veterinary.profile");

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="practiceName"
          id="veterinary-practiceName"
          label={t("practiceName")}
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="veterinary-description">{t("description")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="veterinary-description"
                rows={4}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            control={control}
            name="emergencyPhoneNumber"
            id="veterinary-emergencyPhone"
            label={t("emergencyPhone")}
            type="tel"
          />
          <Controller
            name="serviceAreaKm"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="veterinary-serviceAreaKm">{t("serviceAreaKm")}</FieldLabel>
                <Input
                  {...field}
                  id="veterinary-serviceAreaKm"
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
        <Controller
          name="emergencyAvailability"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4">
              <FieldLabel htmlFor="veterinary-emergencyAvailability">
                {t("emergencyAvailability")}
              </FieldLabel>
              <Switch
                id="veterinary-emergencyAvailability"
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </FieldGroup>
    </div>
  );
}
