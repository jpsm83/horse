/**
 * GroomContactSection — email and phone field group for the Groom Profile tab.
 * Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { GroomProfileFormValues } from "@/lib/validations/groomForms.ts";

type GroomContactSectionProps = {
  control: Control<GroomProfileFormValues>;
};

export function GroomContactSection({ control }: GroomContactSectionProps) {
  const t = useTranslations("groom.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="groom-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="groom-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
    </FieldGroup>
  );
}
