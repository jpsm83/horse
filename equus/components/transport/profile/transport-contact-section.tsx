/**
 * TransportContactSection — email, phone, and emergency phone field group for
 * the Transport Profile tab. Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { TransportProfileFormValues } from "@/lib/validations/transportForms.ts";

type TransportContactSectionProps = {
  control: Control<TransportProfileFormValues>;
};

export function TransportContactSection({ control }: TransportContactSectionProps) {
  const t = useTranslations("transport.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="transport-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="transport-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
      <TextField
        control={control}
        name="emergencyPhoneNumber"
        id="transport-emergencyPhone"
        label={t("emergencyPhone")}
        type="tel"
      />
    </FieldGroup>
  );
}
