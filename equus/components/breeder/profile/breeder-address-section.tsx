/**
 * BreederAddressSection — address field group for the Breeder Profile tab.
 * Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { BreederProfileFormValues } from "@/lib/validations/breederForms.ts";

type BreederAddressSectionProps = {
  control: Control<BreederProfileFormValues>;
};

export function BreederAddressSection({ control }: BreederAddressSectionProps) {
  const t = useTranslations("breeder.profile");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FieldGroup>
        <TextField
          control={control}
          name="address.country"
          id="breeder-country"
          label={t("country")}
          autoComplete="country-name"
        />
        <TextField
          control={control}
          name="address.city"
          id="breeder-city"
          label={t("city")}
          autoComplete="address-level2"
        />
        <TextField
          control={control}
          name="address.state"
          id="breeder-state"
          label={t("state")}
          autoComplete="address-level1"
        />
      </FieldGroup>
      <FieldGroup>
        <TextField
          control={control}
          name="address.street"
          id="breeder-street"
          label={t("street")}
          autoComplete="street-address"
        />
        <TextField
          control={control}
          name="address.buildingNumber"
          id="breeder-buildingNumber"
          label={t("buildingNumber")}
        />
        <TextField
          control={control}
          name="address.postCode"
          id="breeder-postCode"
          label={t("postCode")}
          autoComplete="postal-code"
        />
      </FieldGroup>
    </div>
  );
}
