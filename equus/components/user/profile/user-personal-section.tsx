/**
 * UserPersonalSection — Personal (identity) field group for the Profile tab.
 * Renders the profile image, username, email/verified/provider read-only info,
 * bio, first/last name, gender, and birth date. Receives `control` from the
 * parent deferred form (horse §6.5 pattern).
 */

"use client";

import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";
import { CircleAlert, CircleCheckBig } from "lucide-react";
import { useTranslations } from "next-intl";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { ProfilePhotoField } from "@/components/shared/profile-photo-field.tsx";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatAuthProvider } from "@/lib/api/auth/session";
import type { ProfileFormValues } from "@/lib/validations/profileForms.ts";
import { genderEnums } from "@/utils/enums.ts";

type UserPersonalSectionProps = {
  control: Control<ProfileFormValues>;
  email: string;
  emailVerified: boolean;
  authProvider: string;
  imageUrl?: string;
  previewUrl?: string;
  initials: string;
  onFileSelect: (file: File | undefined) => void;
  onPreviewClear: () => void;
};

export function UserPersonalSection({
  control,
  email,
  emailVerified,
  authProvider,
  imageUrl,
  previewUrl,
  initials,
  onFileSelect,
  onPreviewClear,
}: UserPersonalSectionProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const genderOptions = useMemo(
    () =>
      genderEnums.map((value) => ({
        value,
        label: t(`genderOptions.${value}`),
      })),
    [t],
  );

  return (
    <>
      <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-4">
        <ProfilePhotoField
          imageUrl={imageUrl}
          previewUrl={previewUrl}
          initials={initials || tCommon("owner").charAt(0)}
          disabled={false}
          onFileSelect={onFileSelect}
          onPreviewClear={onPreviewClear}
        />

        <FieldSet className="min-w-0 w-full">
          <FieldGroup>
            <TextField
              control={control}
              name="username"
              id="profile-username"
              label={t("username")}
              autoComplete="username"
            />
            <div className="grid gap-2 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2">
                <p className="min-w-0 wrap-break-word">
                  <span className="text-muted-foreground">
                    {tCommon("email")}:{" "}
                  </span>
                  <span>{email}</span>
                </p>
                <p className="flex shrink-0 items-center gap-1.5">
                  {emailVerified ? (
                    <>
                      <CircleCheckBig
                        className="size-4 shrink-0 text-success"
                        aria-hidden
                      />
                      <span className="text-success">{t("emailVerified")}</span>
                    </>
                  ) : (
                    <>
                      <CircleAlert
                        className="size-4 shrink-0 text-destructive"
                        aria-hidden
                      />
                      <span className="text-destructive">
                        {t("emailNotVerified")}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <p>
                <span className="text-muted-foreground">
                  {t("authProvider")}:{" "}
                </span>
                <span>{formatAuthProvider(authProvider)}</span>
              </p>
            </div>
          </FieldGroup>
        </FieldSet>
      </div>

      <Controller
        name="bio"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="profile-bio">{t("bio")}</FieldLabel>
            <Textarea
              {...field}
              value={field.value ?? ""}
              id="profile-bio"
              rows={4}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : null}
          </Field>
        )}
      />

      <FieldSet>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={control}
              name="firstName"
              id="profile-firstName"
              label={tCommon("firstName")}
              autoComplete="given-name"
            />
            <TextField
              control={control}
              name="lastName"
              id="profile-lastName"
              label={tCommon("lastName")}
              autoComplete="family-name"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="gender"
              control={control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="profile-gender"
                  label={t("gender")}
                  placeholder={tCommon("selectPlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={genderOptions}
                />
              )}
            />
            <TextField
              control={control}
              name="birthDate"
              id="profile-birthDate"
              label={t("birthDate")}
              type="date"
            />
          </div>
        </FieldGroup>
      </FieldSet>
    </>
  );
}
