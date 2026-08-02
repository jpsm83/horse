/**
 * RiderContactSection — email and phone field group for the Rider Profile tab.
 * Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { RiderProfileFormValues } from "@/lib/validations/riderForms.ts";

type RiderContactSectionProps = {
  control: Control<RiderProfileFormValues>;
};

export function RiderContactSection({ control }: RiderContactSectionProps) {
  const t = useTranslations("rider.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="rider-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="rider-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
    </FieldGroup>
  );
}
