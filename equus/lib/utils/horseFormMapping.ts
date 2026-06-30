/**
 * Maps create-horse form values to `POST /api/v1/horses` payloads.
 */

import type { z } from "zod";
import type { createHorseSchema } from "@/lib/validations/horse.ts";
import type { CreateHorseFormValues } from "@/lib/validations/horseForms.ts";

export type CreateHorsePayload = z.infer<typeof createHorseSchema>;

export function mapHorseFormValuesToCreatePayload(
  values: CreateHorseFormValues,
): CreateHorsePayload {
  const payload: CreateHorsePayload = {
    name: values.name.trim(),
    breed: values.breed.trim(),
    sex: values.sex as CreateHorsePayload["sex"],
  };

  if (values.dateOfBirth.trim() !== "") {
    payload.dateOfBirth = new Date(values.dateOfBirth);
  }

  if (values.color.trim() !== "") {
    payload.color = values.color;
  }

  if (values.primaryDiscipline.trim() !== "") {
    payload.primaryDiscipline = values.primaryDiscipline;
  }

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
