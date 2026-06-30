import { describe, expect, it } from "vitest";

import {
  mapProfileFormValuesToPatch,
  mapUserToProfileFormValues,
  readAddressCoordinates,
} from "@/lib/utils/profileFormMapping.ts";
import { emptyProfileFormValues } from "@/lib/validations/profileForms.ts";

describe("readAddressCoordinates", () => {
  it("returns [lng, lat] from Mongo coordinates array", () => {
    expect(
      readAddressCoordinates({ coordinates: [-9.1393, 38.7223] }),
    ).toEqual([-9.1393, 38.7223]);
  });

  it("returns null for invalid coordinates", () => {
    expect(readAddressCoordinates({ coordinates: ["x", "y"] })).toBeNull();
    expect(readAddressCoordinates(undefined)).toBeNull();
  });
});

describe("mapUserToProfileFormValues", () => {
  it("maps null and legacy null strings to empty form fields", () => {
    const values = mapUserToProfileFormValues({
      phoneNumber: "null",
      bio: null,
      address: { city: "null", state: null },
    });

    expect(values.phoneNumber).toBe("");
    expect(values.bio).toBe("");
    expect(values.address.city).toBe("");
    expect(values.address.state).toBe("");
  });

  it("maps preferences with safe defaults", () => {
    const values = mapUserToProfileFormValues(
      { preferredLanguage: "en" },
      { profileVisibility: "private", searchable: false, allowDirectMessagesFrom: "nobody" },
    );

    expect(values.profileVisibility).toBe("private");
    expect(values.searchable).toBe("false");
    expect(values.allowDirectMessagesFrom).toBe("nobody");
  });
});

describe("mapProfileFormValuesToPatch", () => {
  it("includes geocoded coordinates when coordinates changed", () => {
    const patch = mapProfileFormValuesToPatch(
      {
        ...emptyProfileFormValues,
        address: {
          ...emptyProfileFormValues.address,
          country: "PT",
          state: "Lisbon",
          city: "Lisbon",
          street: "Main",
          buildingNumber: "1",
          postCode: "1000",
        },
      },
      {},
      { coordinates: [-9.1393, 38.7223], savedCoordinates: null },
    );

    expect(patch.address?.coordinates).toEqual([-9.1393, 38.7223]);
  });

  it("only includes dirty address fields", () => {
    const patch = mapProfileFormValuesToPatch(
      {
        ...emptyProfileFormValues,
        address: {
          ...emptyProfileFormValues.address,
          country: "PT",
          state: "Lisbon",
          city: "Lisbon",
          street: "Main",
          buildingNumber: "1",
          postCode: "1000",
        },
      },
      { address: { city: true } },
      { coordinates: [-9.1393, 38.7223], savedCoordinates: [-9.1393, 38.7223] },
    );

    expect(patch.address?.city).toBe("Lisbon");
    expect(patch.address?.country).toBeUndefined();
    expect(patch.address?.coordinates).toBeUndefined();
  });

  it("sends empty string when a dirty optional field is cleared", () => {
    const patch = mapProfileFormValuesToPatch(
      {
        ...emptyProfileFormValues,
        phoneNumber: "",
        bio: "",
      },
      { phoneNumber: true, bio: true },
    );

    expect(patch.phoneNumber).toBe("");
    expect(patch.bio).toBe("");
  });

  it("sends address null when dirty address fields are all cleared", () => {
    const patch = mapProfileFormValuesToPatch(
      {
        ...emptyProfileFormValues,
        address: { ...emptyProfileFormValues.address },
      },
      {
        address: {
          country: true,
          state: true,
          city: true,
          street: true,
          buildingNumber: true,
          postCode: true,
        },
      },
      { coordinates: null, savedCoordinates: [-9.1393, 38.7223] },
    );

    expect(patch.address).toBeNull();
  });

  it("includes preferences when visibility fields are dirty", () => {
    const patch = mapProfileFormValuesToPatch(
      {
        ...emptyProfileFormValues,
        profileVisibility: "platform",
        searchable: "false",
        allowDirectMessagesFrom: "relationships",
      },
      {
        profileVisibility: true,
        searchable: true,
        allowDirectMessagesFrom: true,
      },
    );

    expect(patch.preferences).toEqual({
      profileVisibility: "platform",
      searchable: false,
      allowDirectMessagesFrom: "relationships",
    });
  });
});
