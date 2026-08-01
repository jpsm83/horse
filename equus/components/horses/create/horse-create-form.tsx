"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { FlagSelectField } from "@/components/shared/flag-select-field";
import type { FlagSelectOption } from "@/components/shared/country-options";
import { FileUpload, type UploadedFileState } from "@/components/shared/file-upload.tsx";
import { ProfilePhotoField } from "@/components/shared/profile-photo-field.tsx";
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
import { useRouter } from "@/i18n/navigation.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { useCreateHorse } from "@/hooks/queries/useHorse.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { uploadFiles } from "@/lib/cloudinary/clientUpload.ts";
import { getCountrySelectOptions } from "@/lib/profile/selectOptions.ts";
import { mapHorseFormValuesToCreatePayload } from "@/lib/utils/horseFormMapping.ts";
import {
  createHorseFormSchemas,
  emptyCreateHorseFormValues,
  horseFormMessagesFromTranslations,
  type CreateHorseFormValues,
} from "@/lib/validations/horseForms.ts";
import {
  currencyEnums,
  horseBreedEnums,
  horseColorEnums,
  horseDisciplineEnums,
  horseSexEnums,
  saleStatusEnums,
} from "@/utils/enums.ts";

type CreateHorseFormProps = {
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export function CreateHorseForm({ onSubmittingChange }: CreateHorseFormProps) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("createHorse");
  const tVisibility = useTranslations("visibility");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const createHorseMutation = useCreateHorse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<UploadedFileState[]>([]);
  const [profileFile, setProfileFile] = useState<File | undefined>();
  const [profilePreview, setProfilePreview] = useState<string | undefined>();
  // Non-DOM: AbortController held across renders so the in-flight upload can be
  // cancelled from unmount cleanup (an object reference, not a DOM node).
  const abortRef = useRef<AbortController | null>(null);

  const photoLabels = useMemo(
    () => ({
      photoChange: t("photoChange"),
      photoRemovePreview: t("photoRemovePreview"),
      photoInvalidType: t("photoInvalidType"),
      photoTooLarge: t("photoTooLarge"),
    }),
    [t],
  );

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

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const sexOptions = useMemo(
    () => horseSexEnums.map((v) => ({ value: v, label: t(`sexOptions.${v}`) })),
    [t],
  );

  const breedOptions = useMemo(
    () => horseBreedEnums.map((v) => ({ value: v, label: t(`breedOptions.${v}`) })),
    [t],
  );

  const colorOptions = useMemo(
    () => [
      { value: "", label: tCommon("selectPlaceholder") },
      ...horseColorEnums.map((v) => ({ value: v, label: t(`colorOptions.${v}`) })),
    ],
    [t, tCommon],
  );

  const multiDisciplineOptions = useMemo(
    () => horseDisciplineEnums.map((v) => ({ value: v, label: t(`disciplineOptions.${v}`) })),
    [t],
  );

  const visibilityOptions = useMemo(
    () =>
      (["owner", "relationship", "public"] as const).map((v) => ({
        value: v,
        label: tVisibility(`modes.${v}`),
      })),
    [tVisibility],
  );

  const saleStatusOptions = useMemo(
    () => [
      { value: "", label: tCommon("selectPlaceholder") },
      ...saleStatusEnums.map((v) => ({ value: v, label: t(`saleStatusOptions.${v}`) })),
    ],
    [t, tCommon],
  );

  const currencyOptions = useMemo(
    () => [
      { value: "", label: tCommon("selectPlaceholder") },
      ...currencyEnums.map((v) => ({ value: v, label: t(`currencyOptions.${v}`) })),
    ],
    [t, tCommon],
  );

  const countryOptions: FlagSelectOption[] = useMemo(
    () => getCountrySelectOptions(locale),
    [locale],
  );

  async function onSubmit(values: CreateHorseFormValues) {
    setIsSubmitting(true);

    try {
      let profileImageUrl: string | undefined;
      let gallery: string[] = [];

      abortRef.current = new AbortController();

      const uploadables = [...galleryFiles];
      if (profileFile) {
        uploadables.push({
          id: "profile",
          file: profileFile,
          preview: profilePreview,
          status: "pending" as const,
        });
      }

      if (uploadables.length > 0) {
        const results = await uploadFiles(
          uploadables.map((u) => u.file),
          abortRef.current.signal,
        );

        for (const result of results) {
          if (result.error) {
            toast.error(result.error);
            setIsSubmitting(false);
            return;
          }
        }

        const urls = results.map((r) => r.url);
        if (profileFile && urls.length > 0) {
          profileImageUrl = urls[0];
          gallery = urls.slice(1);
        } else {
          gallery = urls;
        }
      }

      const payload = mapHorseFormValuesToCreatePayload(values, {
        profileImageUrl,
        gallery: gallery.length > 0 ? gallery : undefined,
      });

      const result = await createHorseMutation.mutateAsync(payload);
      toast.success(t("success"));
      router.push(`/horses/${result.horse._id}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setIsSubmitting(false);
      abortRef.current = null;
    }
  }

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit(onSubmit)(e);
  };

  return (
    <form
      noValidate
      className="space-y-6 sm:space-y-8"
      onSubmit={submitForm}
    >
      {/* Media */}
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.media")}
        </FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>{t("profileImage")}</FieldLabel>
            <ProfilePhotoField
              previewUrl={profilePreview}
              initials=""
              labels={photoLabels}
              disabled={isSubmitting}
              onFileSelect={(file) => {
                if (!file) return;
                if (profilePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(profilePreview);
                }
                setProfileFile(file);
                setProfilePreview(URL.createObjectURL(file));
              }}
              onPreviewClear={() => {
                if (profilePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(profilePreview);
                }
                setProfileFile(undefined);
                setProfilePreview(undefined);
              }}
              onError={(message) => toast.error(message)}
            />
          </Field>
          <Field>
            <FieldLabel>{t("gallery")}</FieldLabel>
            <FileUpload
              value={galleryFiles}
              onChange={setGalleryFiles}
              disabled={isSubmitting}
            />
          </Field>
          <Controller name="description" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-horse-description">{t("description")}</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="create-horse-description" rows={4} aria-invalid={fieldState.invalid} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )} />
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      {/* Horse identity */}
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.identity")}
        </FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField control={form.control} name="name" id="create-horse-name" label={t("name")} />
            <TextField control={form.control} name="registeredName" id="create-horse-registeredName" label={t("registeredName")} />
            <Controller name="breed" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-breed" label={t("breed")} placeholder={tCommon("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={breedOptions} />
            )} />
            <Controller name="sex" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-sex" label={t("sex")} placeholder={tCommon("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={sexOptions} />
            )} />
            <TextField control={form.control} name="dateOfBirth" id="create-horse-dateOfBirth" label={t("dateOfBirth")} type="date" />
            <Controller name="color" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-color" label={t("color")} placeholder={tCommon("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={colorOptions} />
            )} />
            <TextField control={form.control} name="heightHands" id="create-horse-heightHands" label={t("heightHands")} type="number" />
            <Controller name="disciplines" control={form.control} render={({ field, fieldState }) => (
              <MultiSelectField id="create-horse-disciplines" label={t("disciplines")} value={field.value ?? []} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={multiDisciplineOptions} placeholder={tCommon("selectPlaceholder")} />
            )} />
            <TextField control={form.control} name="registryId" id="create-horse-registryId" label={t("registryId")} />
            <TextField control={form.control} name="microchipId" id="create-horse-microchipId" label={t("microchipId")} />
          </div>
          <TextField control={form.control} name="passportNumber" id="create-horse-passportNumber" label={t("passportNumber")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller name="countryOfBirth" control={form.control} render={({ field, fieldState }) => (
              <FlagSelectField
                id="create-horse-countryOfBirth"
                label={t("countryOfBirth")}
                placeholder={tCommon("selectPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                error={fieldState.error}
                options={countryOptions}
              />
            )} />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      {/* Commercial */}
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.commercial")}
        </FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField control={form.control} name="estimatedValue" id="create-horse-estimatedValue" label={t("estimatedValue")} type="number" />
            <Controller name="valueCurrency" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-valueCurrency" label={t("valueCurrency")} placeholder={tCommon("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={currencyOptions} />
            )} />
            <Controller name="saleStatus" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-saleStatus" label={t("saleStatus")} placeholder={tCommon("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={saleStatusOptions} />
            )} />
            <TextField control={form.control} name="askingPrice" id="create-horse-askingPrice" label={t("askingPrice")} type="number" />
            <TextField control={form.control} name="acquisitionDate" id="create-horse-acquisitionDate" label={t("acquisitionDate")} type="date" />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      {/* Pedigree */}
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.pedigree")}
        </FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField control={form.control} name="pedigree.sireName" id="create-horse-sireName" label={t("sireName")} />
            <TextField control={form.control} name="pedigree.damName" id="create-horse-damName" label={t("damName")} />
          </div>
          <Controller name="pedigree.bloodlineNotes" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-horse-bloodline">{t("bloodlineNotes")}</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="create-horse-bloodline" rows={3} aria-invalid={fieldState.invalid} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )} />
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      {/* Visibility (profileVisibility → discovery API) */}
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.visibility")}
        </FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller name="profileVisibility" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-profileVisibility" label={t("profileVisibility")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={visibilityOptions} />
            )} />
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

// --- Sub-components ---

type MultiSelectFieldProps = {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  invalid: boolean;
  error?: { message?: string };
  options: { value: string; label: string }[];
  placeholder?: string;
};

function MultiSelectField({
  id,
  label,
  value,
  onChange,
  invalid,
  error,
  options,
  placeholder,
}: MultiSelectFieldProps) {
  const tCommon = useTranslations("common");
  const resolvedPlaceholder = placeholder ?? tCommon("selectPlaceholder");
  const [open, setOpen] = useState(false);

  function toggle(optionValue: string) {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  }

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Button
          type="button"
          id={id}
          variant="outline"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-invalid={invalid}
          data-slot="select-trigger"
          className="h-auto w-full justify-between gap-1.5 py-2 pr-2 pl-2.5 font-normal"
        >
          <span className="flex-1 truncate text-left">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : resolvedPlaceholder}
          </span>
          <svg className="size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>

        {open ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              data-slot="select-content"
              className="absolute z-50 mt-1 w-full origin-(--transform-origin) rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 max-h-60 overflow-auto"
            >
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(option.value)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-input">
                      {isSelected ? (
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="flex-1">{option.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
      {invalid ? <FieldError errors={[error]} /> : null}
    </Field>
  );
}


