import { describe, expect, it } from "vitest";

import { mapHorseFormValuesToCreatePayload } from "@/lib/utils/horseFormMapping.ts";
import { emptyCreateHorseFormValues } from "@/lib/validations/horseForms.ts";

describe("mapHorseFormValuesToCreatePayload", () => {
  it("maps minimal required fields only", () => {
    const payload = mapHorseFormValuesToCreatePayload({
      ...emptyCreateHorseFormValues,
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
    });

    expect(payload).toEqual({
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
    });
  });

  it("maps optional identity and discovery fields", () => {
    const payload = mapHorseFormValuesToCreatePayload({
      ...emptyCreateHorseFormValues,
      name: "Nova",
      breed: "Arabian",
      sex: "Mare",
      dateOfBirth: "2020-05-15",
      color: "Bay",
      primaryDiscipline: "Dressage",
      profileVisibility: "relationship",
    });

    expect(payload.name).toBe("Nova");
    expect(payload.dateOfBirth).toEqual(new Date("2020-05-15"));
    expect(payload.color).toBe("Bay");
    expect(payload.primaryDiscipline).toBe("Dressage");
    expect(payload.profileVisibility).toBe("relationship");
  });

  it("omits default profileVisibility", () => {
    const payload = mapHorseFormValuesToCreatePayload({
      ...emptyCreateHorseFormValues,
      name: "Star",
      breed: "Thoroughbred",
      sex: "Colt",
      profileVisibility: "public",
    });

    expect(payload.profileVisibility).toBeUndefined();
  });
});
