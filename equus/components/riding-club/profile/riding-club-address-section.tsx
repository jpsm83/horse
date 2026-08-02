/**
 * RidingClubAddressSection — address field group for the Riding Club Profile
 * tab. Receives `control` from the parent deferred form.
 */

"use client";

import type { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { RidingClubProfileFormValues } from "@/lib/validations/ridingClubForms.ts";

type RidingClubAddressSectionProps = {
  control: Control<RidingClubProfileFormValues>;
};

export function RidingClubAddressSection({ control }: RidingClubAddressSectionProps) {
  const t = useTranslations("ridingClub.profile");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FieldGroup>
        <TextField
          control={control}
          name="address.country"
          id="riding-club-country"
          label={t("country")}
          autoComplete="country-name"
        />
        <TextField
          control={control}
          name="address.city"
          id="riding-club-city"
          label={t("city")}
          autoComplete="address-level2"
        />
        <TextField
          control={control}
          name="address.state"
          id="riding-club-state"
          label={t("state")}
          autoComplete="address-level1"
        />
      </FieldGroup>
      <FieldGroup>
        <TextField
          control={control}
          name="address.street"
          id="riding-club-street"
          label={t("street")}
          autoComplete="street-address"
        />
        <TextField
          control={control}
          name="address.buildingNumber"
          id="riding-club-buildingNumber"
          label={t("buildingNumber")}
        />
        <TextField
          control={control}
          name="address.postCode"
          id="riding-club-postCode"
          label={t("postCode")}
          autoComplete="postal-code"
        />
      </FieldGroup>
    </div>
  );
}
