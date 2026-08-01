/**
 * UserAddressSection — Address field group for the Profile tab.
 * All address fields + geocoded map preview. Receives `control` from the parent
 * deferred form plus the map state owned by the client (horse §6.5 pattern).
 * Layer-2 `address` mode gates the matching hub section.
 */

"use client";

import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";

import { FlagSelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { getCountrySelectOptions } from "@/lib/profile/selectOptions.ts";
import type { ProfileFormValues } from "@/lib/validations/profileForms.ts";

const ProfileAddressMap = dynamic(
  () =>
    import("@/components/user/profile/profile-address-map.tsx").then(
      (mod) => mod.ProfileAddressMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-56 w-full rounded-lg sm:h-64 md:min-h-72" />
      </div>
    ),
  },
);

type UserAddressSectionProps = {
  control: Control<ProfileFormValues>;
  addressQuery: string;
  mapInitialPosition: [number, number] | null;
  onCoordinatesChange: (coordinates: [number, number] | null) => void;
};

export function UserAddressSection({
  control,
  addressQuery,
  mapInitialPosition,
  onCoordinatesChange,
}: UserAddressSectionProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;

  const countryOptions = useMemo(() => getCountrySelectOptions(locale), [locale]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
      <FieldGroup className="min-w-0">
        <div className="flex flex-col gap-5">
          <Controller
            name="address.country"
            control={control}
            render={({ field, fieldState }) => (
              <FlagSelectField
                id="profile-country"
                label={t("country")}
                placeholder={tCommon("selectPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={countryOptions}
              />
            )}
          />
          <TextField
            control={control}
            name="address.state"
            id="profile-state"
            label={t("state")}
            autoComplete="address-level1"
          />
          <TextField
            control={control}
            name="address.street"
            id="profile-street"
            label={t("street")}
            autoComplete="street-address"
          />
          <TextField
            control={control}
            name="address.buildingNumber"
            id="profile-buildingNumber"
            label={t("buildingNumber")}
          />
          <TextField
            control={control}
            name="address.doorNumber"
            id="profile-doorNumber"
            label={t("doorNumber")}
          />
          <TextField
            control={control}
            name="address.complement"
            id="profile-complement"
            label={t("complement")}
          />
          <TextField
            control={control}
            name="address.postCode"
            id="profile-postCode"
            label={t("postCode")}
            autoComplete="postal-code"
          />
          <TextField
            control={control}
            name="address.additionalDetails"
            id="profile-additionalDetails"
            label={t("additionalDetails")}
          />
        </div>
      </FieldGroup>

      <div className="flex min-w-0 flex-col gap-5">
        <TextField
          control={control}
          name="address.region"
          id="profile-region"
          label={t("region")}
        />
        <TextField
          control={control}
          name="address.city"
          id="profile-city"
          label={t("city")}
          autoComplete="address-level2"
        />
        <ProfileAddressMap
          addressQuery={addressQuery}
          initialPosition={mapInitialPosition}
          onCoordinatesChange={onCoordinatesChange}
          className="min-h-0 flex-1"
        />
      </div>
    </div>
  );
}
