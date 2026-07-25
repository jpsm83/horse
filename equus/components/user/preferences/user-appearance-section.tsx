/**
 * UserAppearanceSection — theme swatches and language selector.
 * Receives `control` from the parent deferred form.
 */

"use client";

import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { useTranslations, useLocale } from "next-intl";
import { useMemo } from "react";
import { FlagSelectField } from "@/components/forms/select-field.tsx";
import { cn } from "@/lib/utils";
import { getLanguageSelectOptions } from "@/lib/profile/selectOptions.ts";
import { appThemeEnums } from "@/utils/enums.ts";
import { themeSwatches, type AppTheme } from "@/lib/theme/appTheme.ts";
import type { PreferencesFormValues } from "@/lib/validations/preferencesForms.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";

type Props = {
  control: Control<PreferencesFormValues>;
};

export function UserAppearanceSection({ control }: Props) {
  const t = useTranslations("profile");
  const currentLocale = useLocale() as AppLocale;

  const languageOptions = useMemo(
    () =>
      getLanguageSelectOptions({
        en: t("languageOptions.en"),
        es: t("languageOptions.es"),
      }),
    [t],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          name="preferredLanguage"
          control={control}
          render={({ field, fieldState }) => (
            <FlagSelectField
              id="preferences-language"
              label={t("preferredLanguage")}
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
        control={control}
        render={({ field, fieldState }) => (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{t("preferredTheme")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {appThemeEnums.map((theme) => (
                <ThemeSwatchCard
                  key={theme}
                  theme={theme}
                  label={t(`themeOptions.${theme}`)}
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
    </div>
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
