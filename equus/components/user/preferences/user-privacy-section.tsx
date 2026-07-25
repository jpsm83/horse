/**
 * UserPrivacySection — DM audience preference.
 * Receives `control` from the parent deferred form.
 * Profile visibility (Layer-1) has been moved to the Profile tab.
 */

"use client";

import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { SelectField } from "@/components/forms/select-field.tsx";
import type { PreferencesFormValues } from "@/lib/validations/preferencesForms.ts";

type Props = {
  control: Control<PreferencesFormValues>;
};

export function UserPrivacySection({ control }: Props) {
  const t = useTranslations("profile");

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
