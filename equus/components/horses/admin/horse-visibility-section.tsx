"use client";

/**
 * Horse Admin Visibility section — who can see the Hub / public card.
 * Persists via PATCH /api/v1/horses/:id/discovery (`profileVisibility` only).
 * Hub section modes use PATCH …/hub-sections.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";

import { HorseSelectField } from "@/components/horses/shared/horse-select-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { SaleFormValues } from "@/lib/validations/horseForms.ts";
import { visibilityEnums } from "@/utils/enums.ts";

type HorseVisibilitySectionProps = {
  control: Control<SaleFormValues>;
};

export function HorseVisibilitySection({ control }: HorseVisibilitySectionProps) {
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
            <HorseSelectField
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
