/**
 * UserPrivacySection — Layer-1 profile visibility + DM audience.
 * Receives `control` from the parent deferred form (saved with the Save button).
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { SelectField } from "@/components/forms/select-field.tsx";
import type { PreferencesFormValues } from "@/lib/validations/preferencesForms.ts";

type Props = {
  control: Control<PreferencesFormValues>;
};

export function UserPrivacySection({ control }: Props) {
  const t = useTranslations("profile");

  const visibilityOptions = useMemo(
    () => [
      { value: "public", label: t("visibilityOptions.public") },
      { value: "platform", label: t("visibilityOptions.platform") },
      { value: "relationships", label: t("visibilityOptions.relationshipsOnly") },
      { value: "private", label: t("visibilityOptions.private") },
    ],
    [t],
  );

  const directMessageAudienceOptions = useMemo(
    () => [
      { value: "everyone", label: t("directMessageAudienceOptions.everyone") },
      { value: "relationships", label: t("directMessageAudienceOptions.relationships") },
      { value: "nobody", label: t("directMessageAudienceOptions.nobody") },
    ],
    [t],
  );

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Controller
        name="profileVisibility"
        control={control}
        render={({ field, fieldState }) => (
          <SelectField
            id="preferences-profileVisibility"
            label={t("profileVisibility")}
            value={field.value}
            onChange={field.onChange}
            invalid={fieldState.invalid}
            error={fieldState.error}
            options={visibilityOptions}
          />
        )}
      />
      <Controller
        name="allowDirectMessagesFrom"
        control={control}
        render={({ field, fieldState }) => (
          <SelectField
            id="preferences-directMessages"
            label={t("allowDirectMessagesFrom")}
            value={field.value}
            onChange={field.onChange}
            invalid={fieldState.invalid}
            error={fieldState.error}
            options={directMessageAudienceOptions}
          />
        )}
      />
    </div>
  );
}
