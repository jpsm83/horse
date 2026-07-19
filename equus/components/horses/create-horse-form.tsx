"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
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
  visibilityEnums,
} from "@/utils/enums.ts";

type CreateHorseFormProps = {
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export function CreateHorseForm({ onSubmittingChange }: CreateHorseFormProps) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("createHorse");
  const toast = useAppToast();
  const createHorseMutation = useCreateHorse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<UploadedFileState[]>([]);
  const [profileFile, setProfileFile] = useState<File | undefined>();
  const [profilePreview, setProfilePreview] = useState<string | undefined>();
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

  const useOwnerContact = useWatch({
    control: form.control,
    name: "contactDisplay.useOwnerContact",
  });

  const showContactFields = useOwnerContact === "false";

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
      { value: "", label: t("selectPlaceholder") },
      ...horseColorEnums.map((v) => ({ value: v, label: t(`colorOptions.${v}`) })),
    ],
    [t],
  );

  const disciplineOptions = useMemo(
    () => [
      { value: "", label: t("selectPlaceholder") },
      ...horseDisciplineEnums.map((v) => ({ value: v, label: t(`disciplineOptions.${v}`) })),
    ],
    [t],
  );

  const multiDisciplineOptions = useMemo(
    () => horseDisciplineEnums.map((v) => ({ value: v, label: t(`disciplineOptions.${v}`) })),
    [t],
  );

  const visibilityOptions = useMemo(
    () => visibilityEnums.map((v) => ({ value: v, label: t(`visibilityOptions.${v}`) })),
    [t],
  );

  const useOwnerContactOptions = useMemo(
    () => [
      { value: "true", label: t("useOwnerContactOptions.true") },
      { value: "false", label: t("useOwnerContactOptions.false") },
    ],
    [t],
  );

  const yesNoOptions = useMemo(
    () => [
      { value: "true", label: t("yesNoOptions.true") },
      { value: "false", label: t("yesNoOptions.false") },
    ],
    [t],
  );

  const saleStatusOptions = useMemo(
    () => [
      { value: "", label: t("selectPlaceholder") },
      ...saleStatusEnums.map((v) => ({ value: v, label: t(`saleStatusOptions.${v}`) })),
    ],
    [t],
  );

  const currencyOptions = useMemo(
    () => [
      { value: "", label: t("selectPlaceholder") },
      ...currencyEnums.map((v) => ({ value: v, label: t(`currencyOptions.${v}`) })),
    ],
    [t],
  );

  const countryOptions = useMemo(
    () => [
      { value: "", label: t("selectPlaceholder") },
      ...getCountrySelectOptions(locale).map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    ],
    [locale, t],
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

        for (const [index, result] of results.entries()) {
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
          <Controller name="notes" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-horse-notes">{t("notes")}</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="create-horse-notes" rows={3} aria-invalid={fieldState.invalid} />
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
              <SelectField id="create-horse-breed" label={t("breed")} placeholder={t("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={breedOptions} />
            )} />
            <Controller name="sex" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-sex" label={t("sex")} placeholder={t("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={sexOptions} />
            )} />
            <TextField control={form.control} name="dateOfBirth" id="create-horse-dateOfBirth" label={t("dateOfBirth")} type="date" />
            <TextField control={form.control} name="ageYears" id="create-horse-ageYears" label={t("ageYears")} type="number" />
            <Controller name="color" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-color" label={t("color")} placeholder={t("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={colorOptions} />
            )} />
            <TextField control={form.control} name="heightHands" id="create-horse-heightHands" label={t("heightHands")} type="number" />
            <Controller name="primaryDiscipline" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-primaryDiscipline" label={t("primaryDiscipline")} placeholder={t("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={disciplineOptions} />
            )} />
            <Controller name="disciplines" control={form.control} render={({ field, fieldState }) => (
              <MultiSelectField id="create-horse-disciplines" label={t("disciplines")} value={field.value ?? []} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={multiDisciplineOptions} placeholder={t("selectPlaceholder")} />
            )} />
            <TextField control={form.control} name="registryId" id="create-horse-registryId" label={t("registryId")} />
            <TextField control={form.control} name="microchipId" id="create-horse-microchipId" label={t("microchipId")} />
          </div>
          <TextField control={form.control} name="passportNumber" id="create-horse-passportNumber" label={t("passportNumber")} />
          <Controller name="marksDescription" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-horse-marks">{t("marksDescription")}</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="create-horse-marks" rows={3} aria-invalid={fieldState.invalid} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller name="countryOfBirth" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-countryOfBirth" label={t("countryOfBirth")} placeholder={t("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={countryOptions} />
            )} />
            <TextField control={form.control} name="importExportStatus" id="create-horse-importExport" label={t("importExportStatus")} />
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
              <SelectField id="create-horse-valueCurrency" label={t("valueCurrency")} placeholder={t("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={currencyOptions} />
            )} />
            <Controller name="saleStatus" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-saleStatus" label={t("saleStatus")} placeholder={t("selectPlaceholder")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={saleStatusOptions} />
            )} />
            <TextField control={form.control} name="askingPrice" id="create-horse-askingPrice" label={t("askingPrice")} type="number" />
            <TextField control={form.control} name="acquisitionDate" id="create-horse-acquisitionDate" label={t("acquisitionDate")} type="date" />
            <TextField control={form.control} name="acquisitionSource" id="create-horse-acquisitionSource" label={t("acquisitionSource")} />
            <Controller name="showValuePublicly" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-showValuePublicly" label={t("showValuePublicly")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={yesNoOptions} />
            )} />
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
            <TextField control={form.control} name="pedigree.sireId" id="create-horse-sireId" label={t("sireId")} />
            <TextField control={form.control} name="pedigree.damName" id="create-horse-damName" label={t("damName")} />
            <TextField control={form.control} name="pedigree.damId" id="create-horse-damId" label={t("damId")} />
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

      {/* Discovery */}
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.discovery")}
        </FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller name="profileVisibility" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-profileVisibility" label={t("profileVisibility")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={visibilityOptions} />
            )} />
            <Controller name="contactDisplay.useOwnerContact" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="create-horse-useOwnerContact" label={t("useOwnerContact")} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error} options={useOwnerContactOptions} />
            )} />
            {showContactFields ? (
              <>
                <TextField control={form.control} name="contactDisplay.name" id="create-horse-contactName" label={t("contactName")} />
                <TextField control={form.control} name="contactDisplay.phone" id="create-horse-contactPhone" label={t("contactPhone")} type="tel" />
                <TextField control={form.control} name="contactDisplay.email" id="create-horse-contactEmail" label={t("contactEmail")} type="email" autoComplete="email" />
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
        <button
          type="button"
          id={id}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-invalid={invalid}
          data-slot="select-trigger"
          className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        >
          <span className="flex-1 truncate text-left">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : placeholder ?? "Select\u2026"}
          </span>
          <svg className="size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

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
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(option.value)}
                    className="flex w-full cursor-default items-center gap-2 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-input">
                      {isSelected ? (
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="flex-1">{option.label}</span>
                  </button>
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


