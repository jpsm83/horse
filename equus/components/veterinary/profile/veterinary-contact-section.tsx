/**
 * VeterinaryContactSection — email and phone field group for the Veterinary
 * Profile tab. Receives `control` from the parent deferred form. The emergency
 * phone lives in the identity section.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { VeterinaryProfileFormValues } from "@/lib/validations/veterinaryForms.ts";

type VeterinaryContactSectionProps = {
  control: Control<VeterinaryProfileFormValues>;
};

export function VeterinaryContactSection({ control }: VeterinaryContactSectionProps) {
  const t = useTranslations("veterinary.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="veterinary-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="veterinary-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
    </FieldGroup>
  );
}
