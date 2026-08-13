"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Section } from "@/components/shared/section.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { Button } from "@/components/ui/button";
import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { UserAppearanceSection } from "@/components/user/preferences/user-appearance-section.tsx";
import { UserPrivacySection } from "@/components/user/preferences/user-privacy-section.tsx";
import {
  useSetUnsavedDiscardHandler,
  useUnsavedChanges,
} from "@/components/shared/unsaved-changes-context.tsx";
import { useUpdateProfile, useUserView } from "@/hooks/queries/useCurrentUser.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { syncLocaleCookie } from "@/i18n/syncLocaleCookie.ts";
import {
  applyThemeToDocument,
  normalizeTheme,
  syncThemeCookie,
} from "@/lib/theme/appTheme.ts";
import {
  mapPreferencesFormValuesToPatch,
  mapUserToPreferencesFormValues,
} from "@/lib/utils/preferencesFormMapping.ts";
import {
  createPreferencesFormSchemas,
  emptyPreferencesFormValues,
  preferencesFormMessagesFromTranslations,
  type PreferencesFormValues,
} from "@/lib/validations/preferencesForms.ts";

type PreferencesContentProps = {
  userId: string;
};

export function PreferencesContent({ userId }: PreferencesContentProps) {
  return (
    <UserPageShell userId={userId}>
      <PreferencesForm userId={userId} />
    </UserPageShell>
  );
}

type PreferencesFormProps = {
  userId: string;
};

function PreferencesForm({ userId }: PreferencesFormProps) {
  const t = useTranslations("preferences");
  const tValidation = useTranslations("validation");
  const toast = useAppToast();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as AppLocale;
  const setDiscardHandler = useSetUnsavedDiscardHandler();
  const { setDirty, setSaving } = useUnsavedChanges();

  // useUserView → GET /api/v1/users/:id/view
  const { data: view } = useUserView(userId);
  const profile = view?.user;
  const updateProfile = useUpdateProfile();

  const { preferencesFormSchema } = useMemo(
    () =>
      createPreferencesFormSchemas(
        preferencesFormMessagesFromTranslations((key) => tValidation(key)),
      ),
    [tValidation],
  );

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: emptyPreferencesFormValues,
  });

  // Last-persisted values snapshot for dirty detection across saves.
  const [savedValues, setSavedValues] = useState<PreferencesFormValues>(emptyPreferencesFormValues);

  useEffect(() => {
    if (!profile) return;
    const next = mapUserToPreferencesFormValues(
      profile.personalDetails as Record<string, unknown>,
      profile.preferences as Record<string, unknown> | undefined,
    );
    setSavedValues(next);
    form.reset(next);
  }, [profile, form]);

  const { isDirty } = useFormState({ control: form.control });
  const isSaving = updateProfile.isPending;

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    setSaving(isSaving);
  }, [isSaving, setSaving]);

  const watchedTheme = form.watch("preferredTheme");
  const watchedLanguage = form.watch("preferredLanguage");

  // Live theme preview (DOM only — cookie/DB on Save).
  useEffect(() => {
    if (!profile) return;
    applyThemeToDocument(normalizeTheme(watchedTheme));
  }, [watchedTheme, profile]);

  // Live language preview only while dirty (no cookie write).
  useEffect(() => {
    if (!isDirty) return;
    if (!watchedLanguage || watchedLanguage === currentLocale) return;
    router.replace(pathname, { locale: watchedLanguage as AppLocale });
  }, [watchedLanguage, currentLocale, pathname, router, isDirty]);

  useEffect(() => {
    // Register the discard restore with the layout-level provider (no per-page
    // onDiscard prop once UnsavedChangesProvider lives in UserLayoutChrome).
    setDiscardHandler?.(() => {
      applyThemeToDocument(normalizeTheme(savedValues.preferredTheme));
      if (savedValues.preferredLanguage !== currentLocale) {
        router.replace(pathname, { locale: savedValues.preferredLanguage as AppLocale });
      }
      form.reset(savedValues);
    });
  }, [setDiscardHandler, form, currentLocale, pathname, router, savedValues]);

  async function onSave(values: PreferencesFormValues) {
    const patch = mapPreferencesFormValuesToPatch(values, form.formState.dirtyFields);

    if (Object.keys(patch).length === 0) {
      toast.info(t("noChanges"));
      return;
    }

    try {
      const { user: savedUser } = await updateProfile.mutateAsync({ input: patch });
      const savedValues = mapUserToPreferencesFormValues(
        savedUser.personalDetails as Record<string, unknown>,
        savedUser.preferences as Record<string, unknown> | undefined,
      );

      form.reset(savedValues);
      setSavedValues(savedValues);

      const theme = normalizeTheme(savedValues.preferredTheme);
      applyThemeToDocument(theme);
      syncThemeCookie(theme);

      if (savedValues.preferredLanguage !== currentLocale) {
        syncLocaleCookie(savedValues.preferredLanguage);
        router.replace(pathname, { locale: savedValues.preferredLanguage as AppLocale });
      } else if (patch.preferredLanguage) {
        syncLocaleCookie(savedValues.preferredLanguage);
      }

      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  if (!profile) return null;

  return (
    <>
      <div className="space-y-2 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <form
        className="flex flex-col gap-4 sm:gap-6"
        onSubmit={form.handleSubmit(onSave)}
        noValidate
      >
        <Section
          title={t("sections.appearance")}
          description={t("sectionDescriptions.appearance")}
        >
          <SectionErrorBoundary>
            <UserAppearanceSection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section
          title={t("sections.privacy")}
          description={t("sectionDescriptions.privacy")}
        >
          <SectionErrorBoundary>
            <UserPrivacySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <div className="flex">
          <Button
            type="submit"
            className="w-full sm:ms-auto sm:w-auto"
            disabled={isSaving || !isDirty}
          >
            {isSaving ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </>
  );
}
