"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";

import { HorseProfileSelectField } from "@/components/horses/profile/horse-profile-select-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { DiscoveryFormValues } from "@/lib/validations/horseForms.ts";
import { visibilityEnums } from "@/utils/enums.ts";

type DiscoverySectionProps = {
  control: Control<DiscoveryFormValues>;
};

/** Horse discovery visibility — who can see the Hub / public card. */
export function DiscoverySection({ control }: DiscoverySectionProps) {
  const t = useTranslations("horseProfile");

  const visibilityOptions = useMemo(
    () => visibilityEnums.map((v) => ({ value: v, label: t(`visibilityOptions.${v}`) })),
    [t],
  );

  return (
    <FieldGroup>
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          name="profileVisibility"
          control={control}
          render={({ field, fieldState }) => (
            <HorseProfileSelectField
              id="horse-profileVisibility"
              label={t("profileVisibility")}
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={visibilityOptions}
            />
          )}
        />
      </div>
    </FieldGroup>
  );
}
