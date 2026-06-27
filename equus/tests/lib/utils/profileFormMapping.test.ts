import { describe, expect, it } from "vitest";

import {
  mapProfileFormValuesToPatch,
  mapUserToProfileFormValues,
} from "@/lib/utils/profileFormMapping.ts";
import { emptyProfileFormValues } from "@/lib/validations/profileForms.ts";

describe("profileFormMapping", () => {
  it("defaults preferredLanguage to en when missing on user", () => {
    const values = mapUserToProfileFormValues({ email: "a@example.com" });
    expect(values.preferredLanguage).toBe("en");
  });

  it("always includes preferredLanguage in PATCH payload", () => {
    const patch = mapProfileFormValuesToPatch(emptyProfileFormValues);
    expect(patch.preferredLanguage).toBe("en");
  });

  it("normalizes preferredLanguage on PATCH", () => {
    const patch = mapProfileFormValuesToPatch({
      ...emptyProfileFormValues,
      preferredLanguage: "es",
    });
    expect(patch.preferredLanguage).toBe("es");
  });

  it("maps legacy free-text country values to empty form fields", () => {
    const values = mapUserToProfileFormValues({
      nationality: "Portuguese",
      address: { country: "Portugal" },
    });
    expect(values.nationality).toBe("");
    expect(values.address.country).toBe("");
  });

  it("preserves ISO country codes from API", () => {
    const values = mapUserToProfileFormValues({
      nationality: "PT",
      address: { country: "pt" },
    });
    expect(values.nationality).toBe("PT");
    expect(values.address.country).toBe("PT");
  });
});
