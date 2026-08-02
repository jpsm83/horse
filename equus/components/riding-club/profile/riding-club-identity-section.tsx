/**
 * RidingClubIdentitySection — club name, description, disciplines, facilities,
 * membership info, and membership fee field group for the Riding Club Profile
 * tab. Receives `control` from the parent deferred form.
 */

"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { horseDisciplineEnums } from "@/utils/enums.ts";
import type { RidingClubProfileFormValues } from "@/lib/validations/ridingClubForms.ts";

type RidingClubIdentitySectionProps = {
  control: Control<RidingClubProfileFormValues>;
};

export function RidingClubIdentitySection({ control }: RidingClubIdentitySectionProps) {
  const t = useTranslations("ridingClub.profile");

  const disciplineOptions = horseDisciplineEnums.map((value) => ({ value, label: value }));

  return (
    <div className="flex w-full flex-col gap-5">
      <FieldGroup>
        <TextField
          control={control}
          name="clubName"
          id="riding-club-clubName"
          label={t("clubName")}
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="riding-club-description">{t("description")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="riding-club-description"
                rows={4}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            name="disciplines"
            control={control}
            render={({ field, fieldState }) => (
              <SelectField
                id="riding-club-disciplines"
                label={t("disciplines")}
                value={Array.isArray(field.value) ? field.value[0] ?? "" : ""}
                onChange={(value) => field.onChange(value ? [value] : [])}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={disciplineOptions}
              />
            )}
          />
          <TextField
            control={control}
            name="facilities"
            id="riding-club-facilities"
            label={t("facilities")}
          />
        </div>
        <Controller
          name="membershipInfo"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="riding-club-membershipInfo">{t("membershipInfo")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="riding-club-membershipInfo"
                rows={3}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        <TextField
          control={control}
          name="membershipFee"
          id="riding-club-membershipFee"
          label={t("membershipFee")}
          type="number"
        />
      </FieldGroup>
    </div>
  );
}
