import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { mapMongooseValidationError } from "@/lib/api/errors.ts";
import { updatePersonalDetailsSchema } from "@/lib/validations/user.ts";

describe("updatePersonalDetailsSchema", () => {
  it("sanitizes and accepts valid profile fields", () => {
    const parsed = updatePersonalDetailsSchema.parse({
      firstName: "  Jane  ",
      lastName: "Doe",
      birthDate: "1990-05-01",
    });

    expect(parsed.firstName).toBe("Jane");
    expect(parsed.birthDate).toBeInstanceOf(Date);
  });

  it("rejects invalid enum values", () => {
    expect(() =>
      updatePersonalDetailsSchema.parse({ gender: "invalid" }),
    ).toThrow();
  });

  it("accepts ISO country codes for nationality and address", () => {
    const parsed = updatePersonalDetailsSchema.parse({
      nationality: "pt",
      address: {
        country: "PT",
        state: "Lisbon",
        city: "Lisbon",
        street: "Main",
        buildingNumber: "1",
        postCode: "1000",
      },
    });

    expect(parsed.nationality).toBe("PT");
    expect(parsed.address?.country).toBe("PT");
  });

  it("rejects invalid country codes", () => {
    expect(() =>
      updatePersonalDetailsSchema.parse({ nationality: "Portugal" }),
    ).toThrow();
  });
});

describe("mapMongooseValidationError", () => {
  it("maps ValidationError to structured ApiError fields", () => {
    const error = new mongoose.Error.ValidationError();
    error.addError(
      "personalDetails.phoneNumber",
      new mongoose.Error.ValidatorError({
        path: "personalDetails.phoneNumber",
        message: "Phone number is required!",
      }),
    );

    const apiError = mapMongooseValidationError(error);
    expect(apiError.statusCode).toBe(400);
    expect(apiError.code).toBe("VALIDATION_ERROR");
    expect(apiError.fields).toEqual([
      { path: "personalDetails.phoneNumber", message: "Phone number is required!" },
    ]);
  });
});
