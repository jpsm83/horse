/**
 * FarrierContactSection — email and phone field group for the Farrier Profile
 * tab. Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { FarrierProfileFormValues } from "@/lib/validations/farrierForms.ts";

type FarrierContactSectionProps = {
  control: Control<FarrierProfileFormValues>;
};

export function FarrierContactSection({ control }: FarrierContactSectionProps) {
  const t = useTranslations("farrier.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="farrier-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="farrier-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
    </FieldGroup>
  );
}
