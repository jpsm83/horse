"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Controller, useForm, useFormState, useWatch } from "react-hook-form";

import { FlagSelectField, SelectField } from "@/components/forms/select-field.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useUnsavedChanges } from "@/components/shared/unsaved-changes-context.tsx";
import { Button } from "@/components/ui/button";
import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { useUpdateProfile, useUserProfile } from "@/hooks/queries/useCurrentUser.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { syncLocaleCookie } from "@/i18n/syncLocaleCookie.ts";
import { getLanguageSelectOptions } from "@/lib/profile/selectOptions.ts";
import {
  applyThemeToDocument,
  normalizeTheme,
  syncThemeCookie,
  themeSwatches,
  type AppTheme,
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
import { appThemeEnums } from "@/utils/enums.ts";
import { cn } from "@/lib/utils";

type PreferencesContentProps = {
  userId: string;
};

export function PreferencesContent({ userId }: PreferencesContentProps) {
  const onDiscardRef = useRef<(() => void) | undefined>(undefined);

  return (
    <UserPageShell userId={userId} onDiscard={() => onDiscardRef.current?.()}>
      <PreferencesForm onDiscardRef={onDiscardRef} />
    </UserPageShell>
  );
}

type PreferencesFormProps = {
  onDiscardRef: MutableRefObject<(() => void) | undefined>;
};

function PreferencesForm({ onDiscardRef }: PreferencesFormProps) {
  const t = useTranslations("preferences");
  const tProfile = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const toast = useAppToast();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as AppLocale;
  const { setDirty, setSaving } = useUnsavedChanges();
  const { data: profile, isPending: profileLoading } = useUserProfile(true);
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

  const savedValuesRef = useRef<PreferencesFormValues>(emptyPreferencesFormValues);

  useEffect(() => {
    if (!profile) return;
    const next = mapUserToPreferencesFormValues(
      profile.personalDetails as Record<string, unknown>,
      profile.preferences as Record<string, unknown> | undefined,
    );
    savedValuesRef.current = next;
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

  const watchedTheme = useWatch({ control: form.control, name: "preferredTheme" });
  const watchedLanguage = useWatch({
    control: form.control,
    name: "preferredLanguage",
  });

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
    onDiscardRef.current = () => {
      const saved = savedValuesRef.current;
      applyThemeToDocument(normalizeTheme(saved.preferredTheme));
      if (saved.preferredLanguage !== currentLocale) {
        router.replace(pathname, { locale: saved.preferredLanguage as AppLocale });
      }
      form.reset(saved);
    };
  }, [onDiscardRef, form, currentLocale, pathname, router]);

  const languageOptions = useMemo(
    () =>
      getLanguageSelectOptions({
        en: tProfile("languageOptions.en"),
        es: tProfile("languageOptions.es"),
      }),
    [tProfile],
  );

  const profileVisibilityOptions = useMemo(
    () => [
      { value: "public", label: tProfile("visibilityOptions.public") },
      { value: "platform", label: tProfile("visibilityOptions.platform") },
      {
        value: "relationships",
        label: tProfile("visibilityOptions.relationshipsOnly"),
      },
      { value: "private", label: tProfile("visibilityOptions.private") },
    ],
    [tProfile],
  );

  const directMessageAudienceOptions = useMemo(
    () => [
      {
        value: "everyone",
        label: tProfile("directMessageAudienceOptions.everyone"),
      },
      {
        value: "relationships",
        label: tProfile("directMessageAudienceOptions.relationships"),
      },
      { value: "nobody", label: tProfile("directMessageAudienceOptions.nobody") },
    ],
    [tProfile],
  );

  async function onSave(values: PreferencesFormValues) {
    const patch = mapPreferencesFormValuesToPatch(
      values,
      form.formState.dirtyFields,
    );

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
      savedValuesRef.current = savedValues;

      const theme = normalizeTheme(savedValues.preferredTheme);
      applyThemeToDocument(theme);
      syncThemeCookie(theme);

      if (savedValues.preferredLanguage !== currentLocale) {
        syncLocaleCookie(savedValues.preferredLanguage);
        router.replace(pathname, {
          locale: savedValues.preferredLanguage as AppLocale,
        });
      } else if (patch.preferredLanguage) {
        syncLocaleCookie(savedValues.preferredLanguage);
      }

      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  if (profileLoading || !profile) {
    return null;
  }

  return (
    <>
      <div className="space-y-2 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <form
        className="flex flex-col gap-4 sm:gap-6"
        onSubmit={form.handleSubmit(onSave)}
        noValidate
      >
        <Section title={t("sections.appearance")} description={t("sectionDescriptions.appearance")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="preferredLanguage"
              control={form.control}
              render={({ field, fieldState }) => (
                <FlagSelectField
                  id="preferences-language"
                  label={tProfile("preferredLanguage")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={languageOptions}
                />
              )}
            />
          </div>

          <Controller
            name="preferredTheme"
            control={form.control}
            render={({ field, fieldState }) => (
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">{tProfile("preferredTheme")}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {appThemeEnums.map((theme) => (
                    <ThemeSwatchCard
                      key={theme}
                      theme={theme}
                      label={tProfile(`themeOptions.${theme}`)}
                      selected={field.value === theme}
                      onSelect={() => field.onChange(theme)}
                    />
                  ))}
                </div>
                {fieldState.invalid ? (
                  <p className="text-sm text-destructive">{fieldState.error?.message}</p>
                ) : null}
              </fieldset>
            )}
          />
        </Section>

        <Section title={t("sections.privacy")} description={t("sectionDescriptions.privacy")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="profileVisibility"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="preferences-visibility"
                  label={tProfile("profileVisibility")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={profileVisibilityOptions}
                />
              )}
            />
            <Controller
              name="allowDirectMessagesFrom"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="preferences-directMessages"
                  label={tProfile("allowDirectMessagesFrom")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={directMessageAudienceOptions}
                />
              )}
            />
          </div>
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

function ThemeSwatchCard({
  theme,
  label,
  selected,
  onSelect,
}: {
  theme: AppTheme;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const colors = themeSwatches[theme];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary ring-2 ring-primary/40"
          : "border-border hover:border-muted-foreground/40",
      )}
    >
      <div className="flex h-10 overflow-hidden rounded-md">
        {colors.map((hex) => (
          <span
            key={hex}
            className="h-full flex-1"
            style={{ backgroundColor: hex }}
            aria-hidden
          />
        ))}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
