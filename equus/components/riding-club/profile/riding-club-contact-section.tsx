/**
 * RidingClubContactSection — email and phone field group for the Riding Club
 * Profile tab. Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { RidingClubProfileFormValues } from "@/lib/validations/ridingClubForms.ts";

type RidingClubContactSectionProps = {
  control: Control<RidingClubProfileFormValues>;
};

export function RidingClubContactSection({ control }: RidingClubContactSectionProps) {
  const t = useTranslations("ridingClub.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="riding-club-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="riding-club-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
    </FieldGroup>
  );
}
