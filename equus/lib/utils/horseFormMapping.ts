/**
 * Maps create-horse form values to `POST /api/v1/horses` payloads.
 */

import type { z } from "zod";
import type { createHorseSchema } from "@/lib/validations/horse.ts";
import type { CreateHorseFormValues } from "@/lib/validations/horseForms.ts";

export type CreateHorsePayload = z.infer<typeof createHorseSchema>;

function nonEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function emptyAsUndefined<T>(value: T | ""): T | undefined {
  if (value === "" || value === undefined) return undefined;
  return value;
}

function parseOptionalDate(value: string): Date | undefined {
  if (value.trim() === "") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

export function mapHorseFormValuesToCreatePayload(
  values: CreateHorseFormValues,
  mediaUrls?: { profileImageUrl?: string; gallery?: string[] },
): CreateHorsePayload {
  const payload: CreateHorsePayload = {
    name: values.name.trim(),
    breed: values.breed.trim() as CreateHorsePayload["breed"],
    sex: values.sex as CreateHorsePayload["sex"],
  };

  // Identity extras
  const registeredName = nonEmpty(values.registeredName);
  if (registeredName) payload.registeredName = registeredName;

  const registryId = nonEmpty(values.registryId);
  if (registryId) payload.registryId = registryId;

  const microchipId = nonEmpty(values.microchipId);
  if (microchipId) payload.microchipId = microchipId;

  const passportNumber = nonEmpty(values.passportNumber);
  if (passportNumber) payload.passportNumber = passportNumber;

  const dob = parseOptionalDate(values.dateOfBirth);
  if (dob) payload.dateOfBirth = dob;

  const ageYears = parseOptionalNumber(values.ageYears);
  if (ageYears !== undefined) payload.ageYears = ageYears;

  const color = nonEmpty(values.color);
  if (color) payload.color = color as CreateHorsePayload["color"];

  const marksDescription = nonEmpty(values.marksDescription);
  if (marksDescription) payload.marksDescription = marksDescription;

  const heightHands = parseOptionalNumber(values.heightHands);
  if (heightHands !== undefined) payload.heightHands = heightHands;

  const primaryDiscipline = nonEmpty(values.primaryDiscipline);
  if (primaryDiscipline) payload.primaryDiscipline = primaryDiscipline as CreateHorsePayload["primaryDiscipline"];

  if (values.disciplines && values.disciplines.length > 0) {
    payload.disciplines = values.disciplines;
  }

  const countryOfBirth = nonEmpty(values.countryOfBirth);
  if (countryOfBirth) payload.countryOfBirth = countryOfBirth;

  const importExportStatus = nonEmpty(values.importExportStatus);
  if (importExportStatus) payload.importExportStatus = importExportStatus;

  // Commercial
  const estimatedValue = parseOptionalNumber(values.estimatedValue);
  if (estimatedValue !== undefined) payload.estimatedValue = estimatedValue;

  const valueCurrency = nonEmpty(values.valueCurrency);
  if (valueCurrency) payload.valueCurrency = valueCurrency as CreateHorsePayload["valueCurrency"];

  const saleStatus = nonEmpty(values.saleStatus);
  if (saleStatus) payload.saleStatus = saleStatus as CreateHorsePayload["saleStatus"];

  const askingPrice = parseOptionalNumber(values.askingPrice);
  if (askingPrice !== undefined) payload.askingPrice = askingPrice;

  const acquisitionDate = parseOptionalDate(values.acquisitionDate);
  if (acquisitionDate) payload.acquisitionDate = acquisitionDate;

  const acquisitionSource = nonEmpty(values.acquisitionSource);
  if (acquisitionSource) payload.acquisitionSource = acquisitionSource;

  if (values.showValuePublicly === "true") {
    payload.showValuePublicly = true;
  }

  // Pedigree
  const sireName = nonEmpty(values.pedigree.sireName);
  const sireId = nonEmpty(values.pedigree.sireId);
  const damName = nonEmpty(values.pedigree.damName);
  const damId = nonEmpty(values.pedigree.damId);
  const bloodlineNotes = nonEmpty(values.pedigree.bloodlineNotes);

  if (sireName || sireId || damName || damId || bloodlineNotes) {
    payload.pedigree = {};
    if (sireName) payload.pedigree.sireName = sireName;
    if (sireId) payload.pedigree.sireId = sireId;
    if (damName) payload.pedigree.damName = damName;
    if (damId) payload.pedigree.damId = damId;
    if (bloodlineNotes) payload.pedigree.bloodlineNotes = bloodlineNotes;
  }

  // Media
  if (mediaUrls) {
    if (mediaUrls.profileImageUrl) {
      payload.profileImageUrl = mediaUrls.profileImageUrl;
    }
    if (mediaUrls.gallery && mediaUrls.gallery.length > 0) {
      payload.gallery = mediaUrls.gallery;
    }
  }

  const description = nonEmpty(values.description);
  if (description) payload.description = description;

  const notes = nonEmpty(values.notes);
  if (notes) payload.notes = notes;

  // Discovery
  if (values.profileVisibility !== "public") {
    payload.profileVisibility = values.profileVisibility;
  }

  const useOwnerContact = values.contactDisplay.useOwnerContact === "true";
  if (!useOwnerContact) {
    payload.contactDisplay = {
      useOwnerContact: false,
      name: values.contactDisplay.name.trim(),
      phone: values.contactDisplay.phone.trim(),
      email: values.contactDisplay.email.trim(),
    };
  }

  return payload;
}
