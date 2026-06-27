"use client";

/**
 * Profile edit form — all editable `personalDetails` fields.
 * Submits to `PATCH /api/v1/users/me` (JSON or multipart with avatar).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheckBig, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  FlagSelectField,
  SelectField,
} from "@/components/forms/select-field.tsx";
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
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { syncLocaleCookie } from "@/i18n/syncLocaleCookie.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import {
  formatAuthProvider,
  requestPasswordResetForCurrentUser,
  updateUserProfile,
} from "@/lib/api/authClient.ts";
import type { PublicUser } from "@/lib/services/userService.ts";
import {
  mapProfileFormValuesToPatch,
  mapUserToProfileFormValues,
  readAddressCoordinates,
} from "@/lib/utils/profileFormMapping.ts";
import { buildAddressGeocodeQuery } from "@/lib/utils/buildAddressGeocodeQuery.ts";
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

const ProfileAddressMap = dynamic(
  () =>
    import("@/components/profile/profile-address-map.tsx").then(
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
  onSaved?: (user: PublicUser) => void;
  onSavingChange?: (isSaving: boolean) => void;
};

export function ProfileForm({
  personalDetails,
  email,
  emailVerified,
  authProvider,
  hasPassword,
  imageUrl,
  onSaved,
  onSavingChange,
}: ProfileFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as AppLocale;
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const toast = useAppToast();

  const [imageFile, setImageFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [savedImageUrl, setSavedImageUrl] = useState(imageUrl);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] =
    useState(false);

  const [savedCoordinates, setSavedCoordinates] = useState<[number, number] | null>(() =>
    readAddressCoordinates(
      personalDetails.address as Record<string, unknown> | undefined,
    ),
  );

  const [coordinates, setCoordinates] = useState<[number, number] | null>(
    () => savedCoordinates,
  );

  const { profileFormSchema } = useMemo(
    () =>
      createProfileFormSchemas(
        profileFormMessagesFromTranslations((key) => tValidation(key)),
      ),
    [tValidation],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: mapUserToProfileFormValues(personalDetails),
  });

  const { dirtyFields } = form.formState;

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    onSavingChange?.(isSaving);
  }, [isSaving, onSavingChange]);

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
    const patch = mapProfileFormValuesToPatch(
      values,
      dirtyFields,
      { coordinates, savedCoordinates },
    );

    if (Object.keys(patch).length === 0 && !imageFile) {
      toast.info(t("noChanges"));
      return;
    }

    let outcome: "success" | "error" = "success";
    let errorMessage = "";

    setIsSaving(true);
    try {
      const { user: savedUser } = await updateUserProfile(patch, imageFile);
      const savedDetails = savedUser.personalDetails;
      const savedValues = mapUserToProfileFormValues(savedDetails);

      form.reset(savedValues);
      const savedCoords = readAddressCoordinates(
        savedDetails.address as Record<string, unknown> | undefined,
      );
      setSavedCoordinates(savedCoords);
      setCoordinates(savedCoords);
      setSavedImageUrl(
        typeof savedDetails.imageUrl === "string" ? savedDetails.imageUrl : undefined,
      );
      setImageFile(undefined);
      setPreviewUrl(undefined);
      onSaved?.(savedUser);

      if (
        patch.preferredLanguage &&
        savedValues.preferredLanguage !== currentLocale
      ) {
        syncLocaleCookie(savedValues.preferredLanguage);
        router.replace(pathname, {
          locale: savedValues.preferredLanguage as AppLocale,
        });
      }
    } catch (err) {
      outcome = "error";
      errorMessage = err instanceof Error ? err.message : t("saveFailed");
    } finally {
      setIsSaving(false);
    }

    if (outcome === "success") {
      toast.success(t("saved"));
    } else {
      toast.error(errorMessage);
    }
  }

  async function handlePasswordEmail() {
    setIsRequestingPasswordReset(true);

    let outcome: "success" | "error" = "success";
    let successMessage = "";
    let errorMessage = "";

    try {
      const result = await requestPasswordResetForCurrentUser();
      successMessage = result.message;
    } catch (err) {
      outcome = "error";
      errorMessage =
        err instanceof Error ? err.message : t("passwordEmailFailed");
    } finally {
      setIsRequestingPasswordReset(false);
    }

    if (outcome === "success") {
      toast.success(successMessage);
    } else {
      toast.error(errorMessage);
    }
  }

  const watchedFirstName = useWatch({
    control: form.control,
    name: "firstName",
  });
  const watchedLastName = useWatch({ control: form.control, name: "lastName" });
  const watchedAddress = useWatch({ control: form.control, name: "address" });

  const addressQuery = useMemo(
    () => buildAddressGeocodeQuery(watchedAddress, currentLocale),
    [watchedAddress, currentLocale],
  );

  const mapInitialPosition = useMemo((): [number, number] | null => {
    if (!coordinates) return null;
    return [coordinates[1], coordinates[0]];
  }, [coordinates?.[0], coordinates?.[1]]);

  const initials = [watchedFirstName, watchedLastName]
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <form
      className="space-y-6 sm:space-y-8"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-4">
        <ProfilePhotoField
          imageUrl={savedImageUrl}
          previewUrl={previewUrl}
          initials={initials || tCommon("owner").charAt(0)}
          disabled={isRequestingPasswordReset}
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

        <FieldSet className="min-w-0 w-full">
          <FieldGroup>
            <TextField
              control={form.control}
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
                        className="size-4 shrink-0 text-green-600 dark:text-green-500"
                        aria-hidden
                      />
                      <span className="text-green-600 dark:text-green-500">
                        {t("emailVerified")}
                      </span>
                    </>
                  ) : (
                    <>
                      <CircleAlert
                        className="size-4 shrink-0 text-red-600 dark:text-red-500"
                        aria-hidden
                      />
                      <span className="text-red-600 dark:text-red-500">
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
        control={form.control}
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

      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.personal")}
        </FieldLegend>
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

          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.address")}
        </FieldLegend>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <FieldGroup className="min-w-0">
            <div className="flex flex-col gap-5">
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
              <TextField
                control={form.control}
                name="address.street"
                id="profile-street"
                label={t("street")}
                autoComplete="street-address"
              />
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
              <TextField
                control={form.control}
                name="address.complement"
                id="profile-complement"
                label={t("complement")}
              />
              <TextField
                control={form.control}
                name="address.postCode"
                id="profile-postCode"
                label={t("postCode")}
                autoComplete="postal-code"
              />
              <TextField
                control={form.control}
                name="address.additionalDetails"
                id="profile-additionalDetails"
                label={t("additionalDetails")}
              />
            </div>
          </FieldGroup>

          <div className="flex min-w-0 flex-col gap-5">
            <TextField
              control={form.control}
              name="address.region"
              id="profile-region"
              label={t("region")}
            />
            <TextField
              control={form.control}
              name="address.city"
              id="profile-city"
              label={t("city")}
              autoComplete="address-level2"
            />
            <ProfileAddressMap
              addressQuery={addressQuery}
              initialPosition={mapInitialPosition}
              onCoordinatesChange={setCoordinates}
              className="min-h-0 flex-1"
            />
          </div>
        </div>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.security")}
        </FieldLegend>
        <FieldGroup>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isRequestingPasswordReset}
              onClick={() => void handlePasswordEmail()}
            >
              <Lock className="size-4" aria-hidden />
              {hasPassword ? t("passwordChange") : t("passwordSet")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {hasPassword
                ? t("passwordChangeDescription")
                : t("passwordSetDescription")}
            </p>
          </div>
        </FieldGroup>
      </FieldSet>

      <div className="flex">
        <Button
          type="submit"
          className="w-full sm:ms-auto sm:w-auto"
          disabled={isSaving || isRequestingPasswordReset}
        >
          {isSaving ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
