"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
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
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateHorse } from "@/hooks/queries/useHorse.ts";
import type { OwnerHorseSummary } from "@/lib/api/horseClient";
import {
  editHorseFormSchemas,
  horseFormMessagesFromTranslations,
  type EditHorseFormValues,
} from "@/lib/validations/horseForms.ts";
import {
  horseBreedEnums,
  horseColorEnums,
  horseDisciplineEnums,
  horseSexEnums,
} from "@/utils/enums.ts";
import { useRouter } from "@/i18n/navigation";

type HorseEditFormProps = {
  horseId: string;
  horse: OwnerHorseSummary;
  onSaved: () => void;
};

export function HorseEditForm({ horseId, horse, onSaved }: HorseEditFormProps) {
  const router = useRouter();
  const t = useTranslations("horseEdit");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const updateHorse = useUpdateHorse();

  const formMessages = useMemo(
    () => horseFormMessagesFromTranslations(t),
    [t],
  );

  const { editHorseFormSchema } = useMemo(
    () => editHorseFormSchemas(formMessages),
    [formMessages],
  );

  const form = useForm<EditHorseFormValues>({
    resolver: zodResolver(editHorseFormSchema),
    defaultValues: {
      name: horse.name ?? "",
      breed: horse.breed ?? "",
      sex: horse.sex ?? "",
      registeredName: horse.registeredName ?? "",
      registryId: horse.registryId ?? "",
      microchipId: horse.microchipId ?? "",
      passportNumber: horse.passportNumber ?? "",
      color: horse.color ?? "",
      heightHands: horse.heightHands != null ? String(horse.heightHands) : "",
      dateOfBirth: horse.dateOfBirth ? horse.dateOfBirth.slice(0, 10) : "",
      marksDescription: horse.marksDescription ?? "",
      countryOfBirth: horse.countryOfBirth ?? "",
      importExportStatus: horse.importExportStatus ?? "",
      primaryDiscipline: horse.primaryDiscipline ?? "",
      disciplines: (horse.disciplines ?? []) as EditHorseFormValues["disciplines"],
      description: horse.description ?? "",
      notes: horse.notes ?? "",
      pedigree: {
        sireName: (horse.pedigree as Record<string, unknown> | undefined)?.sireName as string ?? "",
        sireId: (horse.pedigree as Record<string, unknown> | undefined)?.sireId as string ?? "",
        damName: (horse.pedigree as Record<string, unknown> | undefined)?.damName as string ?? "",
        damId: (horse.pedigree as Record<string, unknown> | undefined)?.damId as string ?? "",
        bloodlineNotes: (horse.pedigree as Record<string, unknown> | undefined)?.bloodlineNotes as string ?? "",
      },
    },
  });

  const { dirtyFields } = form.formState;
  const isPending = updateHorse.isPending;

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

  function buildPatch(values: EditHorseFormValues): Record<string, unknown> {
    const patch: Record<string, unknown> = {};
    const dirty = dirtyFields as Record<string, boolean | object>;

    if (dirty.name) patch.name = values.name.trim();
    if (dirty.breed) patch.breed = values.breed.trim();
    if (dirty.sex) patch.sex = values.sex.trim();
    if (dirty.registeredName) patch.registeredName = values.registeredName.trim() || "";
    if (dirty.registryId) patch.registryId = values.registryId.trim() || "";
    if (dirty.microchipId) patch.microchipId = values.microchipId.trim() || "";
    if (dirty.passportNumber) patch.passportNumber = values.passportNumber.trim() || "";
    if (dirty.color) patch.color = values.color.trim() || "";
    if (dirty.heightHands) {
      const h = values.heightHands.trim();
      patch.heightHands = h ? Number(h) : "";
    }
    if (dirty.dateOfBirth) {
      const d = values.dateOfBirth.trim();
      patch.dateOfBirth = d ? new Date(d) : "";
    }
    if (dirty.marksDescription) patch.marksDescription = values.marksDescription.trim() || "";
    if (dirty.countryOfBirth) patch.countryOfBirth = values.countryOfBirth.trim() || "";
    if (dirty.importExportStatus) patch.importExportStatus = values.importExportStatus.trim() || "";
    if (dirty.primaryDiscipline) patch.primaryDiscipline = values.primaryDiscipline.trim() || "";
    if (dirty.disciplines) {
      patch.disciplines = Array.isArray(values.disciplines) ? values.disciplines : [];
    }
    if (dirty.description) patch.description = values.description.trim() || "";
    if (dirty.notes) patch.notes = values.notes.trim() || "";

    const pedigreeDirty = dirty.pedigree as Record<string, boolean> | undefined;
    if (pedigreeDirty && typeof pedigreeDirty === "object") {
      const pedigreePatch: Record<string, string> = {};
      if (pedigreeDirty.sireName) pedigreePatch.sireName = values.pedigree.sireName.trim() || "";
      if (pedigreeDirty.sireId) pedigreePatch.sireId = values.pedigree.sireId.trim() || "";
      if (pedigreeDirty.damName) pedigreePatch.damName = values.pedigree.damName.trim() || "";
      if (pedigreeDirty.damId) pedigreePatch.damId = values.pedigree.damId.trim() || "";
      if (pedigreeDirty.bloodlineNotes) pedigreePatch.bloodlineNotes = values.pedigree.bloodlineNotes.trim() || "";
      if (Object.keys(pedigreePatch).length > 0) {
        patch.pedigree = pedigreePatch;
      }
    }

    return patch;
  }

  async function onSubmit(values: EditHorseFormValues) {
    const patch = buildPatch(values);

    if (Object.keys(patch).length === 0) {
      toast.info(t("noChanges"));
      return;
    }

    try {
      await updateHorse.mutateAsync({ horseId, patch });
      toast.success(t("saved"));
      onSaved();
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">{t("sections.identity")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="name"
              id="edit-name"
              label={t("name")}
            />
            <Controller
              name="breed"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="edit-breed"
                  label={t("breed")}
                  placeholder={t("selectPlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={breedOptions}
                />
              )}
            />
            <Controller
              name="sex"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="edit-sex"
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
            <Controller
              name="color"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="edit-color"
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
            <TextField
              control={form.control}
              name="heightHands"
              id="edit-heightHands"
              label={t("heightHands")}
              type="number"
            />
            <TextField
              control={form.control}
              name="dateOfBirth"
              id="edit-dateOfBirth"
              label={t("dateOfBirth")}
              type="date"
            />
            <TextField
              control={form.control}
              name="marksDescription"
              id="edit-marksDescription"
              label={t("marksDescription")}
            />
            <TextField
              control={form.control}
              name="countryOfBirth"
              id="edit-countryOfBirth"
              label={t("countryOfBirth")}
            />
            <TextField
              control={form.control}
              name="importExportStatus"
              id="edit-importExportStatus"
              label={t("importExportStatus")}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">{t("sections.identification")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="registeredName"
              id="edit-registeredName"
              label={t("registeredName")}
            />
            <TextField
              control={form.control}
              name="registryId"
              id="edit-registryId"
              label={t("registryId")}
            />
            <TextField
              control={form.control}
              name="microchipId"
              id="edit-microchipId"
              label={t("microchipId")}
            />
            <TextField
              control={form.control}
              name="passportNumber"
              id="edit-passportNumber"
              label={t("passportNumber")}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">{t("sections.disciplines")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="primaryDiscipline"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="edit-primaryDiscipline"
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
        <FieldLegend className="pb-3 font-semibold">{t("sections.description")}</FieldLegend>
        <FieldGroup>
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-description">{t("description")}</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="edit-description"
                  rows={4}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-notes">{t("notes")}</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="edit-notes"
                  rows={4}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">{t("sections.pedigree")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="pedigree.sireName"
              id="edit-sireName"
              label={t("sireName")}
            />
            <TextField
              control={form.control}
              name="pedigree.sireId"
              id="edit-sireId"
              label={t("sireId")}
            />
            <TextField
              control={form.control}
              name="pedigree.damName"
              id="edit-damName"
              label={t("damName")}
            />
            <TextField
              control={form.control}
              name="pedigree.damId"
              id="edit-damId"
              label={t("damId")}
            />
          </div>
          <Controller
            name="pedigree.bloodlineNotes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-bloodlineNotes">{t("bloodlineNotes")}</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="edit-bloodlineNotes"
                  rows={3}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/horses/${horseId}`)}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
