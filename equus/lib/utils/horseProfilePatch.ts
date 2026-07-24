/**
 * Map horse data ↔ profile form values and build PATCH payloads from dirty fields.
 */

import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";
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
  for (const key of ["sireName", "sireId", "damName", "damId", "bloodlineNotes"] as const) {
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
    marksDescription: "",
    heightHands: "",
    dateOfBirth: "",
    ageYears: "",
    countryOfBirth: "",
    registeredName: "",
    registryId: "",
    microchipId: "",
    passportNumber: "",
    primaryDiscipline: "",
    disciplines: [],
    description: "",
    notes: "",
    pedigree: {
      sireName: "",
      sireId: "",
      damName: "",
      damId: "",
      bloodlineNotes: "",
    },
    profileVisibility: "public",
    contactDisplay: {
      useOwnerContact: "true",
      name: "",
      phone: "",
      email: "",
    },
  };
}

export function toProfileFormValues(horse: OwnerHorseSummary): ProfileFormValues {
  const pedigree = (horse.pedigree ?? {}) as Record<string, string>;
  const contact = (horse.contactDisplay ?? {}) as Record<string, string | boolean>;

  return {
    name: horse.name ?? "",
    breed: horse.breed ?? "",
    sex: horse.sex ?? "",
    color: horse.color ?? "",
    marksDescription: horse.marksDescription ?? "",
    heightHands: horse.heightHands != null ? String(horse.heightHands) : "",
    dateOfBirth: horse.dateOfBirth ? horse.dateOfBirth.slice(0, 10) : "",
    ageYears: horse.ageYears != null ? String(horse.ageYears) : "",
    countryOfBirth: horse.countryOfBirth ?? "",
    registeredName: horse.registeredName ?? "",
    registryId: horse.registryId ?? "",
    microchipId: horse.microchipId ?? "",
    passportNumber: horse.passportNumber ?? "",
    primaryDiscipline: horse.primaryDiscipline ?? "",
    disciplines: (horse.disciplines ?? []) as ProfileFormValues["disciplines"],
    description: horse.description ?? "",
    notes: horse.notes ?? "",
    pedigree: {
      sireName: pedigree.sireName ?? "",
      sireId: pedigree.sireId ?? "",
      damName: pedigree.damName ?? "",
      damId: pedigree.damId ?? "",
      bloodlineNotes: pedigree.bloodlineNotes ?? "",
    },
    profileVisibility: (horse.profileVisibility ??
      "public") as ProfileFormValues["profileVisibility"],
    contactDisplay: {
      useOwnerContact: contact.useOwnerContact === false ? "false" : "true",
      name: String(contact.name ?? ""),
      phone: String(contact.phone ?? ""),
      email: String(contact.email ?? ""),
    },
  };
}

export type ProfileSavePatches = {
  horsePatch: Record<string, unknown>;
  discoveryPatch: Record<string, unknown>;
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
    marksDescription: buildOptionalStringPatch(dirty, "marksDescription", values.marksDescription),
    heightHands: buildNumberPatch(dirty, "heightHands", values.heightHands),
    dateOfBirth: buildDatePatch(dirty, "dateOfBirth", values.dateOfBirth),
    ageYears: buildNumberPatch(dirty, "ageYears", values.ageYears),
    countryOfBirth: buildOptionalStringPatch(dirty, "countryOfBirth", values.countryOfBirth),
    registeredName: buildOptionalStringPatch(dirty, "registeredName", values.registeredName),
    registryId: buildOptionalStringPatch(dirty, "registryId", values.registryId),
    microchipId: buildOptionalStringPatch(dirty, "microchipId", values.microchipId),
    passportNumber: buildOptionalStringPatch(dirty, "passportNumber", values.passportNumber),
    primaryDiscipline: dirty.primaryDiscipline
      ? values.primaryDiscipline.trim() || ""
      : undefined,
    disciplines: dirty.disciplines
      ? Array.isArray(values.disciplines)
        ? values.disciplines
        : []
      : undefined,
    description: buildOptionalStringPatch(dirty, "description", values.description),
    notes: buildOptionalStringPatch(dirty, "notes", values.notes),
    pedigree: buildPedigreePatch(dirty, values.pedigree),
  });

  const discoveryPatch: Record<string, unknown> = {};
  if (dirty.profileVisibility) {
    discoveryPatch.profileVisibility = values.profileVisibility;
  }

  const contactDirty = dirty.contactDisplay as Record<string, boolean> | undefined;
  if (contactDirty && typeof contactDirty === "object") {
    const contactPatch: Record<string, unknown> = {};
    if (contactDirty.useOwnerContact) {
      contactPatch.useOwnerContact = values.contactDisplay.useOwnerContact === "true";
    }
    if (values.contactDisplay.useOwnerContact === "false") {
      if (contactDirty.name) contactPatch.name = values.contactDisplay.name.trim();
      if (contactDirty.phone) contactPatch.phone = values.contactDisplay.phone.trim();
      if (contactDirty.email) contactPatch.email = values.contactDisplay.email.trim();
    }
    if (Object.keys(contactPatch).length > 0) {
      discoveryPatch.contactDisplay = contactPatch;
    }
  }

  return { horsePatch, discoveryPatch };
}
