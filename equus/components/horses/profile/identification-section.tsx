"use client";

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { ProfileFormValues } from "@/lib/validations/horseForms.ts";

type IdentificationSectionProps = {
  control: Control<ProfileFormValues>;
};

export function IdentificationSection({ control }: IdentificationSectionProps) {
  const t = useTranslations("horseProfile");

  return (
    <FieldGroup>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          control={control}
          name="registeredName"
          id="profile-registeredName"
          label={t("registeredName")}
        />
        <TextField
          control={control}
          name="registryId"
          id="profile-registryId"
          label={t("registryId")}
        />
        <TextField
          control={control}
          name="microchipId"
          id="profile-microchipId"
          label={t("microchipId")}
        />
        <TextField
          control={control}
          name="passportNumber"
          id="profile-passportNumber"
          label={t("passportNumber")}
        />
      </div>
    </FieldGroup>
  );
}
