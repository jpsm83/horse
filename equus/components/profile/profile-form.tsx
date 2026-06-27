"use client";

/**
 * Profile edit form — all editable `personalDetails` fields.
 * Submits to `PATCH /api/v1/users/me` (JSON or multipart with avatar).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FlagSelectField, SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { ProfilePhotoField } from "@/components/profile/profile-photo-field.tsx";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { syncLocaleCookie } from "@/i18n/syncLocaleCookie.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import {
  formatAuthProvider,
  requestPasswordResetForCurrentUser,
  updateUserProfile,
} from "@/lib/api/authClient.ts";
import {
  mapProfileFormValuesToPatch,
  mapUserToProfileFormValues,
} from "@/lib/utils/profileFormMapping.ts";
import {
  createProfileFormSchemas,
  profileFormMessagesFromTranslations,
  type ProfileFormValues,
} from "@/lib/validations/profileForms.ts";
import {
  getCountrySelectOptions,
  getLanguageSelectOptions,
} from "@/lib/profile/selectOptions.ts";

import { genderEnums, idTypeEnums } from "@/utils/enums.ts";

const ID_TYPE_TRANSLATION_KEYS: Record<(typeof idTypeEnums)[number], string> = {
  Passport: "passport",
  "National ID": "nationalId",
  "Driver License": "driverLicense",
  "Tax ID": "taxId",
  Other: "other",
};

type ProfileFormProps = {
  personalDetails: Record<string, unknown>;
  email: string;
  emailVerified: boolean;
  authProvider: string;
  hasPassword: boolean;
  imageUrl?: string;
};

export function ProfileForm({
  personalDetails,
  email,
  emailVerified,
  authProvider,
  hasPassword,
  imageUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as AppLocale;
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tHome = useTranslations("home");
  const toast = useAppToast();

  const [imageFile, setImageFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = useState(false);

  const initialPreferredLanguage = useMemo(
    () => mapUserToProfileFormValues(personalDetails).preferredLanguage,
    [personalDetails],
  );

  const { profileFormSchema } = useMemo(
    () =>
      createProfileFormSchemas(profileFormMessagesFromTranslations((key) => tValidation(key))),
    [tValidation],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: mapUserToProfileFormValues(personalDetails),
  });

  const isSubmitting = form.formState.isSubmitting;

  const genderOptions = genderEnums.map((value) => ({
    value,
    label: t(`genderOptions.${value}`),
  }));

  const idTypeOptions = idTypeEnums.map((value) => ({
    value,
    label: t(`idTypeOptions.${ID_TYPE_TRANSLATION_KEYS[value]}`),
  }));

  const languageOptions = useMemo(
    () =>
      getLanguageSelectOptions({
        en: t("languageOptions.en"),
        es: t("languageOptions.es"),
      }),
    [t],
  );

  const countryOptions = useMemo(
    () => getCountrySelectOptions(currentLocale),
    [currentLocale],
  );

  async function onSubmit(values: ProfileFormValues) {
    const patch = mapProfileFormValuesToPatch(values);
    const hasPatch = Object.keys(patch).length > 0;

    if (!hasPatch && !imageFile) {
      toast.success(t("saved"));
      return;
    }

    try {
      await updateUserProfile(patch, imageFile);

      if (
        values.preferredLanguage !== initialPreferredLanguage ||
        values.preferredLanguage !== currentLocale
      ) {
        syncLocaleCookie(values.preferredLanguage);
        router.replace(pathname, { locale: values.preferredLanguage as AppLocale });
      } else {
        router.refresh();
      }

      setImageFile(undefined);
      setPreviewUrl(undefined);
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    }
  }

  async function handlePasswordEmail() {
    setIsRequestingPasswordReset(true);
    try {
      const result = await requestPasswordResetForCurrentUser();
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("passwordEmailFailed"));
    } finally {
      setIsRequestingPasswordReset(false);
    }
  }

  const watchedFirstName = useWatch({ control: form.control, name: "firstName" });
  const watchedLastName = useWatch({ control: form.control, name: "lastName" });

  const initials = [watchedFirstName, watchedLastName]
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <ProfilePhotoField
        imageUrl={imageUrl}
        previewUrl={previewUrl}
        initials={initials || tHome("owner").charAt(0)}
        disabled={isSubmitting || isRequestingPasswordReset}
        onFileSelect={(file) => {
          if (!file) return;
          if (previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
          }
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }}
        onPreviewClear={() => {
          if (previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
          }
          setImageFile(undefined);
          setPreviewUrl(undefined);
        }}
      />

      <FieldSet>
        <FieldLegend>{t("sections.account")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">{tCommon("email")}: </span>
              <span>{email}</span>
            </p>
            <p>
              <span className="text-muted-foreground">
                {emailVerified ? t("emailVerified") : t("emailNotVerified")}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">{t("authProvider")}: </span>
              <span>{formatAuthProvider(authProvider)}</span>
            </p>
          </div>
          <TextField
            control={form.control}
            name="username"
            id="profile-username"
            label={t("username")}
            autoComplete="username"
          />
          <Controller
            name="preferredLanguage"
            control={form.control}
            render={({ field, fieldState }) => (
              <FlagSelectField
                id="profile-preferredLanguage"
                label={t("preferredLanguage")}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={languageOptions}
              />
            )}
          />
          <TextField
            control={form.control}
            name="timezone"
            id="profile-timezone"
            label={t("timezone")}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.security")}</FieldLegend>
        <FieldGroup>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || isRequestingPasswordReset}
              onClick={() => void handlePasswordEmail()}
            >
              <Lock className="size-4" aria-hidden />
              {hasPassword ? t("passwordChange") : t("passwordSet")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {hasPassword ? t("passwordChangeDescription") : t("passwordSetDescription")}
            </p>
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.personal")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="firstName"
              id="profile-firstName"
              label={tCommon("firstName")}
              autoComplete="given-name"
            />
            <TextField
              control={form.control}
              name="lastName"
              id="profile-lastName"
              label={tCommon("lastName")}
              autoComplete="family-name"
            />
          </div>
          <Controller
            name="gender"
            control={form.control}
            render={({ field, fieldState }) => (
              <SelectField
                id="profile-gender"
                label={t("gender")}
                placeholder={t("selectPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={genderOptions}
              />
            )}
          />
          <TextField
            control={form.control}
            name="birthDate"
            id="profile-birthDate"
            label={t("birthDate")}
            type="date"
          />
          <Controller
            name="nationality"
            control={form.control}
            render={({ field, fieldState }) => (
              <FlagSelectField
                id="profile-nationality"
                label={t("nationality")}
                placeholder={t("selectPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={countryOptions}
              />
            )}
          />
          <TextField
            control={form.control}
            name="phoneNumber"
            id="profile-phoneNumber"
            label={t("phoneNumber")}
            type="tel"
            autoComplete="tel"
          />
          <Controller
            name="bio"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="profile-bio">{t("bio")}</FieldLabel>
                <Textarea {...field} id="profile-bio" rows={4} aria-invalid={fieldState.invalid} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.identity")}</FieldLegend>
        <FieldGroup>
          <Controller
            name="idType"
            control={form.control}
            render={({ field, fieldState }) => (
              <SelectField
                id="profile-idType"
                label={t("idType")}
                placeholder={t("selectPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={idTypeOptions}
              />
            )}
          />
          <TextField
            control={form.control}
            name="idNumber"
            id="profile-idNumber"
            label={t("idNumber")}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.address")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="address.country"
              control={form.control}
              render={({ field, fieldState }) => (
                <FlagSelectField
                  id="profile-country"
                  label={t("country")}
                  placeholder={t("selectPlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={countryOptions}
                />
              )}
            />
            <TextField
              control={form.control}
              name="address.state"
              id="profile-state"
              label={t("state")}
              autoComplete="address-level1"
            />
          </div>
          <TextField
            control={form.control}
            name="address.city"
            id="profile-city"
            label={t("city")}
            autoComplete="address-level2"
          />
          <TextField
            control={form.control}
            name="address.street"
            id="profile-street"
            label={t("street")}
            autoComplete="street-address"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="address.buildingNumber"
              id="profile-buildingNumber"
              label={t("buildingNumber")}
            />
            <TextField
              control={form.control}
              name="address.doorNumber"
              id="profile-doorNumber"
              label={t("doorNumber")}
            />
          </div>
          <TextField
            control={form.control}
            name="address.complement"
            id="profile-complement"
            label={t("complement")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="address.postCode"
              id="profile-postCode"
              label={t("postCode")}
              autoComplete="postal-code"
            />
            <TextField
              control={form.control}
              name="address.region"
              id="profile-region"
              label={t("region")}
            />
          </div>
          <TextField
            control={form.control}
            name="address.additionalDetails"
            id="profile-additionalDetails"
            label={t("additionalDetails")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="address.longitude"
              id="profile-longitude"
              label={t("longitude")}
              type="number"
            />
            <TextField
              control={form.control}
              name="address.latitude"
              id="profile-latitude"
              label={t("latitude")}
              type="number"
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <Button type="submit" disabled={isSubmitting || isRequestingPasswordReset}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
