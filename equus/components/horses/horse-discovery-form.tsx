"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { OwnerHorseSummary } from "@/lib/api/horseClient";
import { visibilityEnums } from "@/utils/enums.ts";
import { useRouter } from "@/i18n/navigation";

type HorseDiscoveryFormProps = {
  horseId: string;
  horse: OwnerHorseSummary;
  onSaved: () => void;
};

export function HorseDiscoveryForm({ horseId, horse, onSaved }: HorseDiscoveryFormProps) {
  const router = useRouter();
  const t = useTranslations("horseDiscovery");
  const tCommon = useTranslations("common");
  const toast = useAppToast();

  const contactDisplay = horse.contactDisplay as Record<string, unknown> | undefined;
  const useOwnerContact = contactDisplay?.useOwnerContact !== false;

  const form = useForm({
    defaultValues: {
      profileVisibility: horse.profileVisibility ?? "public",
      useOwnerContact: useOwnerContact ? "true" : "false",
      contactName: String(contactDisplay?.name ?? ""),
      contactPhone: String(contactDisplay?.phone ?? ""),
      contactEmail: String(contactDisplay?.email ?? ""),
    },
  });

  const { dirtyFields } = form.formState;
  const isSubmitting = form.formState.isSubmitting;
  const showContactFields = form.watch("useOwnerContact") === "false";

  const visibilityOptions = useMemo(
    () => visibilityEnums.map((v) => ({ value: v, label: t(`visibilityOptions.${v}`) })),
    [t],
  );

  const yesNoOptions = useMemo(
    () => [
      { value: "true", label: t("yes") },
      { value: "false", label: t("no") },
    ],
    [t],
  );

  async function onSubmit(values: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    const dirty = dirtyFields as Record<string, boolean>;

    if (dirty.profileVisibility) {
      patch.profileVisibility = String(values.profileVisibility).trim();
    }

    if (dirty.useOwnerContact || dirty.contactName || dirty.contactPhone || dirty.contactEmail) {
      const useOwner = values.useOwnerContact === "true";
      patch.contactDisplay = {
        useOwnerContact: useOwner,
      };
      if (!useOwner) {
        patch.contactDisplay.name = String(values.contactName).trim();
        patch.contactDisplay.phone = String(values.contactPhone).trim();
        patch.contactDisplay.email = String(values.contactEmail).trim();
      }
    }

    if (Object.keys(patch).length === 0) {
      toast.info(t("noChanges"));
      return;
    }

    try {
      const res = await fetch(`/api/v1/horses/${horseId}/discovery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(t("saved"));
      onSaved();
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">{t("visibilityTitle")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="profileVisibility"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="disc-profileVisibility"
                  label={t("profileVisibility")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={visibilityOptions}
                />
              )}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">{t("contactTitle")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="useOwnerContact"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="disc-useOwnerContact"
                  label={t("useOwnerContact")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={yesNoOptions}
                />
              )}
            />
          </div>

          {showContactFields && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">{t("customContact")}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="contactName"
                  id="disc-contactName"
                  label={tCommon("name")}
                />
                <TextField
                  control={form.control}
                  name="contactPhone"
                  id="disc-contactPhone"
                  label={tCommon("phone")}
                  type="tel"
                />
                <TextField
                  control={form.control}
                  name="contactEmail"
                  id="disc-contactEmail"
                  label={tCommon("email")}
                  type="email"
                />
              </div>
            </div>
          )}
        </FieldGroup>
      </FieldSet>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/horses/${horseId}`)}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
