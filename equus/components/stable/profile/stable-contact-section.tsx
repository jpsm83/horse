/**
 * StableContactSection — email, phone, and website field group for the Stable
 * Profile tab. Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { StableProfileFormValues } from "@/lib/validations/stableForms.ts";

type StableContactSectionProps = {
  control: Control<StableProfileFormValues>;
};

export function StableContactSection({ control }: StableContactSectionProps) {
  const t = useTranslations("stable.profile");

  return (
    <FieldGroup>
      <TextField
        control={control}
        name="email"
        id="stable-email"
        label={t("email")}
        type="email"
        autoComplete="email"
      />
      <TextField
        control={control}
        name="phoneNumber"
        id="stable-phone"
        label={t("phone")}
        type="tel"
        autoComplete="tel"
      />
      <TextField
        control={control}
        name="websiteUrl"
        id="stable-website"
        label={t("website")}
        type="url"
      />
    </FieldGroup>
  );
}
