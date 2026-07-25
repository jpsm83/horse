/**
 * Map horse data ↔ profile form values and build PATCH payloads from dirty fields.
 */

import type { OwnerHorseSummary } from "@/lib/services/horseService.ts";
import type { ProfileFormValues } from "@/lib/validations/horseForms.ts";

type DirtyFields = Record<string, boolean | object | undefined>;

function isDirty(dirty: DirtyFields, key: string): boolean {
  return dirty[key] === true;
}

export function buildStringPatch(
  dirty: DirtyFields,
  key: string,
  value: string,
  trim = true,
): string | undefined {
  if (!isDirty(dirty, key)) return undefined;
  const v = trim ? value.trim() : value;
  return v;
}

export function buildOptionalStringPatch(
  dirty: DirtyFields,
  key: string,
  value: string,
): string | "" | undefined {
  if (!isDirty(dirty, key)) return undefined;
  return value.trim() || "";
}

export function buildNumberPatch(
  dirty: DirtyFields,
  key: string,
  value: string,
): number | "" | undefined {
  if (!isDirty(dirty, key)) return undefined;
  const v = value.trim();
  return v ? Number(v) : "";
}

export function buildDatePatch(
  dirty: DirtyFields,
  key: string,
  value: string,
): Date | "" | undefined {
  if (!isDirty(dirty, key)) return undefined;
  const v = value.trim();
  return v ? new Date(v) : "";
}

export function buildPedigreePatch(
  dirty: DirtyFields,
  pedigree: Record<string, string>,
): Record<string, string> | undefined {
  const pedigreeDirty = dirty.pedigree as Record<string, boolean> | undefined;
  if (!pedigreeDirty || typeof pedigreeDirty !== "object") return undefined;

  const patch: Record<string, string> = {};
  for (const key of ["sireName", "damName", "bloodlineNotes"] as const) {
    if (pedigreeDirty[key]) {
      patch[key] = pedigree[key]?.trim() || "";
    }
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

export function collectPatch(entries: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      patch[key] = value;
    }
  }
  return patch;
}

export function emptyProfileFormValues(): ProfileFormValues {
  return {
    name: "",
    breed: "",
    sex: "",
    color: "",
    heightHands: "",
    dateOfBirth: "",
    countryOfBirth: "",
    registeredName: "",
    registryId: "",
    microchipId: "",
    passportNumber: "",
    disciplines: [],
    description: "",
    pedigree: {
      sireName: "",
      damName: "",
      bloodlineNotes: "",
    },
  };
}

export function toProfileFormValues(horse: OwnerHorseSummary): ProfileFormValues {
  const pedigree = (horse.pedigree ?? {}) as Record<string, string>;

  return {
    name: horse.name ?? "",
    breed: horse.breed ?? "",
    sex: horse.sex ?? "",
    color: horse.color ?? "",
    heightHands: horse.heightHands != null ? String(horse.heightHands) : "",
    dateOfBirth: horse.dateOfBirth ? horse.dateOfBirth.slice(0, 10) : "",
    countryOfBirth: horse.countryOfBirth ?? "",
    registeredName: horse.registeredName ?? "",
    registryId: horse.registryId ?? "",
    microchipId: horse.microchipId ?? "",
    passportNumber: horse.passportNumber ?? "",
    disciplines: (horse.disciplines ?? []) as ProfileFormValues["disciplines"],
    description: horse.description ?? "",
    pedigree: {
      sireName: pedigree.sireName ?? "",
      damName: pedigree.damName ?? "",
      bloodlineNotes: pedigree.bloodlineNotes ?? "",
    },
  };
}

export type ProfileSavePatches = {
  horsePatch: Record<string, unknown>;
};

export function buildProfileSavePatches(
  values: ProfileFormValues,
  dirty: DirtyFields,
): ProfileSavePatches {
  const horsePatch = collectPatch({
    name: buildStringPatch(dirty, "name", values.name),
    breed: buildStringPatch(dirty, "breed", values.breed),
    sex: buildStringPatch(dirty, "sex", values.sex),
    color: buildOptionalStringPatch(dirty, "color", values.color),
    heightHands: buildNumberPatch(dirty, "heightHands", values.heightHands),
    dateOfBirth: buildDatePatch(dirty, "dateOfBirth", values.dateOfBirth),
    countryOfBirth: buildStringPatch(dirty, "countryOfBirth", values.countryOfBirth),
    registeredName: buildOptionalStringPatch(dirty, "registeredName", values.registeredName),
    registryId: buildOptionalStringPatch(dirty, "registryId", values.registryId),
    microchipId: buildOptionalStringPatch(dirty, "microchipId", values.microchipId),
    passportNumber: buildOptionalStringPatch(dirty, "passportNumber", values.passportNumber),
    disciplines: dirty.disciplines
      ? Array.isArray(values.disciplines)
        ? values.disciplines
        : []
      : undefined,
    description: buildOptionalStringPatch(dirty, "description", values.description),
    pedigree: buildPedigreePatch(dirty, values.pedigree),
  });

  return { horsePatch };
}
