/**
 * BreederContactSection — email and phone field group for the Breeder Profile
 * tab. Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { BreederProfileFormValues } from "@/lib/validations/breederForms.ts";

type BreederContactSectionProps = {
  control: Control<BreederProfileFormValues>;
};

export function BreederContactSection({ control }: BreederContactSectionProps) {
  const t = useTranslations("breeder.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="breeder-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="breeder-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
    </FieldGroup>
  );
}
