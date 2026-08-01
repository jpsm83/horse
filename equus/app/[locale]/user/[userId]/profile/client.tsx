"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/shared/loading-overlay.tsx";
import { Section } from "@/components/shared/section.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { UserPersonalSection } from "@/components/user/profile/user-personal-section.tsx";
import { UserIdentificationSection } from "@/components/user/profile/user-identification-section.tsx";
import { UserAddressSection } from "@/components/user/profile/user-address-section.tsx";
import { UserAccountTypeSection } from "@/components/user/profile/user-account-type-section.tsx";
import { UserSecuritySection } from "@/components/user/profile/user-security-section.tsx";
import { UserAccountSection } from "@/components/user/profile/user-account-section.tsx";
import { UserSectionVisibility } from "@/components/user/shared/user-section-visibility.tsx";
import { useUnsavedChanges } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUpdateProfile, useUserView } from "@/hooks/queries/useCurrentUser.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { queryKeys } from "@/lib/api/queryKeys";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { normalizeUserHubSections } from "@/lib/users/userHubSections.ts";
import { buildAddressGeocodeQuery } from "@/lib/utils/buildAddressGeocodeQuery.ts";
import {
  mapProfileFormValuesToPatch,
  mapUserToProfileFormValues,
  readAddressCoordinates,
} from "@/lib/utils/profileFormMapping.ts";
import {
  createProfileFormSchemas,
  emptyProfileFormValues,
  profileFormMessagesFromTranslations,
  type ProfileFormValues,
} from "@/lib/validations/profileForms.ts";

type ProfileContentProps = {
  userId: string;
};

export function ProfileContent({ userId }: ProfileContentProps) {
  return (
    <UserPageShell userId={userId}>
      <ProfileFormContent userId={userId} />
    </UserPageShell>
  );
}

function ProfileFormContent({ userId }: ProfileContentProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const currentLocale = useLocale() as AppLocale;
  const { user } = useAppAuth();
  const { data: view } = useUserView(userId);
  const profile = view?.user;
  const { setDirty, setSaving } = useUnsavedChanges();
  const updateProfile = useUpdateProfile();

  const [imageFile, setImageFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [savedImageUrl, setSavedImageUrl] = useState<string | undefined>(undefined);
  const [savedCoordinates, setSavedCoordinates] = useState<[number, number] | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const { profileFormSchema } = useMemo(
    () =>
      createProfileFormSchemas(
        profileFormMessagesFromTranslations((key) => tValidation(key)),
      ),
    [tValidation],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: emptyProfileFormValues,
  });

  // Seed the form + photo/coordinates state once the owner view is cached.
  // Render-time adjustment (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded user id.
  const [seededUserId, setSeededUserId] = useState<string | null>(null);
  if (profile && seededUserId !== profile.id) {
    setSeededUserId(profile.id);
    const personalDetails = (profile.personalDetails ?? {}) as Record<string, unknown>;
    form.reset(
      mapUserToProfileFormValues(
        personalDetails,
        profile.userType ?? "individual",
        (profile.businessDetails as Record<string, unknown> | undefined) ?? undefined,
      ),
    );
    setSavedImageUrl(
      typeof personalDetails.imageUrl === "string" ? personalDetails.imageUrl : undefined,
    );
    const coords = readAddressCoordinates(
      personalDetails.address as Record<string, unknown> | undefined,
    );
    setSavedCoordinates(coords);
    setCoordinates(coords);
  }

  const { isDirty, dirtyFields } = form.formState;

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    setSaving(isSaving || isDeactivating);
  }, [isSaving, isDeactivating, setSaving]);

  const watchedFirstName = useWatch({ control: form.control, name: "firstName" });
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

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handlePreviewClear() {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(undefined);
    setPreviewUrl(undefined);
  }

  async function onSave(values: ProfileFormValues) {
    const patch = mapProfileFormValuesToPatch(values, dirtyFields, {
      coordinates,
      savedCoordinates,
    });

    if (Object.keys(patch).length === 0 && !imageFile) {
      toast.info(t("noChanges"));
      return;
    }

    setIsSaving(true);
    try {
      const { user: savedUser } = await updateProfile.mutateAsync({
        input: patch,
        imageFile: imageFile ?? undefined,
      });
      const savedDetails = savedUser.personalDetails;
      const savedValues = mapUserToProfileFormValues(
        savedDetails,
        savedUser.userType,
        savedUser.businessDetails as Record<string, unknown> | undefined,
      );

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
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.view(userId) });

      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile || !user) return null;

  const hubSections = normalizeUserHubSections(profile.hubSections);
  const personalDetails = (profile.personalDetails ?? {}) as Record<string, unknown>;
  const email = typeof personalDetails.email === "string" ? personalDetails.email : user.email;
  const emailVerified = user.emailVerified === true;
  const authProvider = user.authProvider ?? "credentials";
  const hasPassword = profile.hasPassword ?? user.hasPassword ?? false;

  return (
    <div className="relative isolate z-0 flex min-h-0 flex-1 flex-col gap-6" aria-busy={isSaving || isDeactivating}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {!user.profileComplete ? (
        <Alert>
          <AlertDescription>{t("incompleteBanner")}</AlertDescription>
        </Alert>
      ) : null}

      <Section
        title={t("sections.personal")}
        visibilityControl={
          <UserSectionVisibility
            userId={userId}
            sectionKey="identity"
            mode={hubSections.identity.mode}
          />
        }
      >
        <SectionErrorBoundary>
          <UserPersonalSection
            control={form.control}
            email={email}
            emailVerified={emailVerified}
            authProvider={authProvider}
            imageUrl={savedImageUrl}
            previewUrl={previewUrl}
            initials={initials || tCommon("owner").charAt(0)}
            onFileSelect={handleFileSelect}
            onPreviewClear={handlePreviewClear}
          />
        </SectionErrorBoundary>
      </Section>

      <Section
        title={t("sections.identification")}
        visibilityControl={
          <UserSectionVisibility
            userId={userId}
            sectionKey="identification"
            mode={hubSections.identification.mode}
          />
        }
      >
        <SectionErrorBoundary>
          <UserIdentificationSection control={form.control} />
        </SectionErrorBoundary>
      </Section>

      <Section
        title={t("sections.address")}
        visibilityControl={
          <UserSectionVisibility
            userId={userId}
            sectionKey="address"
            mode={hubSections.address.mode}
          />
        }
      >
        <SectionErrorBoundary>
          <UserAddressSection
            control={form.control}
            addressQuery={addressQuery}
            mapInitialPosition={mapInitialPosition}
            onCoordinatesChange={setCoordinates}
          />
        </SectionErrorBoundary>
      </Section>

      <Section title={t("sections.security")}>
        <SectionErrorBoundary>
          <UserSecuritySection hasPassword={hasPassword} authProvider={authProvider} />
        </SectionErrorBoundary>
      </Section>

      <Section title={t("sections.account")}>
        <SectionErrorBoundary>
          <UserAccountTypeSection control={form.control} />
        </SectionErrorBoundary>
        <hr className="my-4" />
        <SectionErrorBoundary>
          <UserAccountSection onDeactivatingChange={setIsDeactivating} />
        </SectionErrorBoundary>
      </Section>

      <div className="flex">
        <Button
          type="button"
          className="w-full sm:ms-auto sm:w-auto"
          disabled={isSaving}
          onClick={form.handleSubmit(onSave, () => toast.error(t("validationFailed")))}
        >
          {isSaving ? t("submitting") : t("submit")}
        </Button>
      </div>

      <LoadingOverlay
        active={isSaving || isDeactivating}
        label={isDeactivating ? t("deactivateSubmitting") : tCommon("loading")}
      />
    </div>
  );
}
