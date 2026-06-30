"use client";

/**
 * Create-horse form — submits to `POST /api/v1/horses`.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { createHorse } from "@/lib/api/horseClient.ts";
import { mapHorseFormValuesToCreatePayload } from "@/lib/utils/horseFormMapping.ts";
import {
  createHorseFormSchemas,
  emptyCreateHorseFormValues,
  horseFormMessagesFromTranslations,
  type CreateHorseFormValues,
} from "@/lib/validations/horseForms.ts";
import {
  horseColorEnums,
  horseDisciplineEnums,
  horseSexEnums,
  visibilityEnums,
} from "@/utils/enums.ts";

type CreateHorseFormProps = {
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export function CreateHorseForm({ onSubmittingChange }: CreateHorseFormProps) {
  const router = useRouter();
  const t = useTranslations("createHorse");
  const toast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMessages = useMemo(
    () => horseFormMessagesFromTranslations(t),
    [t],
  );

  const { createHorseFormSchema } = useMemo(
    () => createHorseFormSchemas(formMessages),
    [formMessages],
  );

  const form = useForm<CreateHorseFormValues>({
    resolver: zodResolver(createHorseFormSchema),
    defaultValues: emptyCreateHorseFormValues,
    mode: "onSubmit",
  });

  const useOwnerContact = useWatch({
    control: form.control,
    name: "contactDisplay.useOwnerContact",
  });

  const sexOptions = useMemo(
    () =>
      horseSexEnums.map((value) => ({
        value,
        label: t(`sexOptions.${value}`),
      })),
    [t],
  );

  const colorOptions = useMemo(
    () => [
      { value: "", label: t("selectPlaceholder") },
      ...horseColorEnums.map((value) => ({
        value,
        label: t(`colorOptions.${value}`),
      })),
    ],
    [t],
  );

  const disciplineOptions = useMemo(
    () => [
      { value: "", label: t("selectPlaceholder") },
      ...horseDisciplineEnums.map((value) => ({
        value,
        label: t(`disciplineOptions.${value}`),
      })),
    ],
    [t],
  );

  const visibilityOptions = useMemo(
    () =>
      visibilityEnums.map((value) => ({
        value,
        label: t(`visibilityOptions.${value}`),
      })),
    [t],
  );

  const useOwnerContactOptions = useMemo(
    () => [
      { value: "true", label: t("useOwnerContactOptions.true") },
      { value: "false", label: t("useOwnerContactOptions.false") },
    ],
    [t],
  );

  async function onSubmit(values: CreateHorseFormValues) {
    setIsSubmitting(true);
    onSubmittingChange?.(true);

    let outcome: "success" | "error" = "success";
    let errorMessage = "";

    try {
      const payload = mapHorseFormValuesToCreatePayload(values);
      const { horse } = await createHorse(payload);
      toast.success(t("success"));
      router.push(`/my/horses/${horse._id}`);
    } catch (err) {
      outcome = "error";
      errorMessage = err instanceof Error ? err.message : t("saveFailed");
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }

    if (outcome === "error") {
      toast.error(errorMessage);
    }
  }

  return (
    <form
      noValidate
      className="space-y-6 sm:space-y-8"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.identity")}
        </FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="name"
              id="create-horse-name"
              label={t("name")}
            />
            <TextField
              control={form.control}
              name="breed"
              id="create-horse-breed"
              label={t("breed")}
            />
            <Controller
              name="sex"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="create-horse-sex"
                  label={t("sex")}
                  placeholder={t("selectPlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={sexOptions}
                />
              )}
            />
            <TextField
              control={form.control}
              name="dateOfBirth"
              id="create-horse-dateOfBirth"
              label={t("dateOfBirth")}
              type="date"
            />
            <Controller
              name="color"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="create-horse-color"
                  label={t("color")}
                  placeholder={t("selectPlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={colorOptions}
                />
              )}
            />
            <Controller
              name="primaryDiscipline"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="create-horse-primaryDiscipline"
                  label={t("primaryDiscipline")}
                  placeholder={t("selectPlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={disciplineOptions}
                />
              )}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.discovery")}
        </FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="profileVisibility"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="create-horse-profileVisibility"
                  label={t("profileVisibility")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={visibilityOptions}
                />
              )}
            />
            <Controller
              name="contactDisplay.useOwnerContact"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="create-horse-useOwnerContact"
                  label={t("useOwnerContact")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={useOwnerContactOptions}
                />
              )}
            />
            {useOwnerContact === "false" ? (
              <>
                <TextField
                  control={form.control}
                  name="contactDisplay.name"
                  id="create-horse-contactName"
                  label={t("contactName")}
                />
                <TextField
                  control={form.control}
                  name="contactDisplay.phone"
                  id="create-horse-contactPhone"
                  label={t("contactPhone")}
                  type="tel"
                />
                <TextField
                  control={form.control}
                  name="contactDisplay.email"
                  id="create-horse-contactEmail"
                  label={t("contactEmail")}
                  type="email"
                  autoComplete="email"
                />
              </>
            ) : null}
          </div>
        </FieldGroup>
      </FieldSet>

      <div className="flex">
        <Button
          type="submit"
          className="w-full sm:ms-auto sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
