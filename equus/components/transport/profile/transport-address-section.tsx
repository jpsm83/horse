/**
 * TransportAddressSection — address field group for the Transport Profile tab.
 * Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { TransportProfileFormValues } from "@/lib/validations/transportForms.ts";

type TransportAddressSectionProps = {
  control: Control<TransportProfileFormValues>;
};

export function TransportAddressSection({ control }: TransportAddressSectionProps) {
  const t = useTranslations("transport.profile");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FieldGroup>
        <TextField
          control={control}
          name="address.country"
          id="transport-country"
          label={t("country")}
          autoComplete="country-name"
        />
        <TextField
          control={control}
          name="address.city"
          id="transport-city"
          label={t("city")}
          autoComplete="address-level2"
        />
        <TextField
          control={control}
          name="address.state"
          id="transport-state"
          label={t("state")}
          autoComplete="address-level1"
        />
      </FieldGroup>
      <FieldGroup>
        <TextField
          control={control}
          name="address.street"
          id="transport-street"
          label={t("street")}
          autoComplete="street-address"
        />
        <TextField
          control={control}
          name="address.buildingNumber"
          id="transport-buildingNumber"
          label={t("buildingNumber")}
        />
        <TextField
          control={control}
          name="address.postCode"
          id="transport-postCode"
          label={t("postCode")}
          autoComplete="postal-code"
        />
      </FieldGroup>
    </div>
  );
}
