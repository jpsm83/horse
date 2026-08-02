/**
 * TrainerContactSection — email and phone field group for the Trainer Profile
 * tab. Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { TrainerProfileFormValues } from "@/lib/validations/trainerForms.ts";

type TrainerContactSectionProps = {
  control: Control<TrainerProfileFormValues>;
};

export function TrainerContactSection({ control }: TrainerContactSectionProps) {
  const t = useTranslations("trainer.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="trainer-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="trainer-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
    </FieldGroup>
  );
}
