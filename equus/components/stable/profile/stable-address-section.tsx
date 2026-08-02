/**
 * StableAddressSection — address field group for the Stable Profile tab.
 * Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { StableProfileFormValues } from "@/lib/validations/stableForms.ts";

type StableAddressSectionProps = {
  control: Control<StableProfileFormValues>;
};

export function StableAddressSection({ control }: StableAddressSectionProps) {
  const t = useTranslations("stable.profile");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FieldGroup>
        <TextField
          control={control}
          name="address.country"
          id="stable-country"
          label={t("country")}
          autoComplete="country-name"
        />
        <TextField
          control={control}
          name="address.city"
          id="stable-city"
          label={t("city")}
          autoComplete="address-level2"
        />
        <TextField
          control={control}
          name="address.state"
          id="stable-state"
          label={t("state")}
          autoComplete="address-level1"
        />
      </FieldGroup>
      <FieldGroup>
        <TextField
          control={control}
          name="address.street"
          id="stable-street"
          label={t("street")}
          autoComplete="street-address"
        />
        <TextField
          control={control}
          name="address.buildingNumber"
          id="stable-buildingNumber"
          label={t("buildingNumber")}
        />
        <TextField
          control={control}
          name="address.postCode"
          id="stable-postCode"
          label={t("postCode")}
          autoComplete="postal-code"
        />
      </FieldGroup>
    </div>
  );
}
