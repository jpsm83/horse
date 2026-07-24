/**
 * Maps create-horse form values to `POST /api/v1/horses` payloads.
 */

import type { z } from "zod";
import type { createHorseSchema } from "@/lib/validations/horse.ts";
import type { CreateHorseFormValues } from "@/lib/validations/horseForms.ts";
import { normalizeHorseIdentityFields } from "@/lib/utils/horseIdentity.ts";

export type CreateHorsePayload = z.infer<typeof createHorseSchema>;

function nonEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
  const payload = {
    name: values.name.trim(),
    breed: values.breed.trim() as CreateHorsePayload["breed"],
    sex: values.sex as CreateHorsePayload["sex"],
  } as CreateHorsePayload;

  // Identity extras
  const registeredName = nonEmpty(values.registeredName);
  if (registeredName) payload.registeredName = registeredName;

  const identity = normalizeHorseIdentityFields({
    registryId: values.registryId,
    microchipId: values.microchipId,
    passportNumber: values.passportNumber,
  });
  if (identity.registryId) payload.registryId = identity.registryId;
  if (identity.microchipId) payload.microchipId = identity.microchipId;
  if (identity.passportNumber) payload.passportNumber = identity.passportNumber;

  const dob = parseOptionalDate(values.dateOfBirth);
  if (dob) payload.dateOfBirth = dob;

  const color = nonEmpty(values.color);
  if (color) payload.color = color as CreateHorsePayload["color"];

  const heightHands = parseOptionalNumber(values.heightHands);
  if (heightHands !== undefined) payload.heightHands = heightHands;

  if (values.disciplines && values.disciplines.length > 0) {
    payload.disciplines = values.disciplines;
  }

  const countryOfBirth = nonEmpty(values.countryOfBirth);
  if (countryOfBirth) payload.countryOfBirth = countryOfBirth;

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
  const damName = nonEmpty(values.pedigree.damName);
  const bloodlineNotes = nonEmpty(values.pedigree.bloodlineNotes);

  if (sireName || damName || bloodlineNotes) {
    payload.pedigree = {};
    if (sireName) payload.pedigree.sireName = sireName;
    if (damName) payload.pedigree.damName = damName;
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

  // Discovery
  if (values.profileVisibility !== "public") {
    payload.profileVisibility = values.profileVisibility;
  }

  return payload;
}
