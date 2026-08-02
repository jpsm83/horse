/**
 * CoachContactSection — email and phone field group for the Coach Profile tab.
 * Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { CoachProfileFormValues } from "@/lib/validations/coachForms.ts";

type CoachContactSectionProps = {
  control: Control<CoachProfileFormValues>;
};

export function CoachContactSection({ control }: CoachContactSectionProps) {
  const t = useTranslations("coach.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="coach-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="coach-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
    </FieldGroup>
  );
}
