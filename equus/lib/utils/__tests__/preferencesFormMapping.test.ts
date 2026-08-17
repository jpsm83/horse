import { describe, expect, it } from "vitest";

import {
  mapPreferencesFormValuesToPatch,
  mapUserToPreferencesFormValues,
} from "@/lib/utils/preferencesFormMapping.ts";
import { emptyPreferencesFormValues } from "@/lib/validations/preferencesForms.ts";

describe("mapUserToPreferencesFormValues", () => {
  it("defaults missing theme/language/privacy", () => {
    const values = mapUserToPreferencesFormValues({ email: "a@b.com" });
    expect(values).toEqual(emptyPreferencesFormValues);
  });

  it("maps saved preference fields", () => {
    const values = mapUserToPreferencesFormValues(
      { preferredLanguage: "es", preferredTheme: "onyx" },
      { allowDirectMessagesFrom: "nobody" },
    );

    expect(values.preferredLanguage).toBe("es");
    expect(values.preferredTheme).toBe("onyx");
    expect(values.allowDirectMessagesFrom).toBe("nobody");
  });
});

describe("mapPreferencesFormValuesToPatch", () => {
  it("includes only dirty preference fields", () => {
    const patch = mapPreferencesFormValuesToPatch(
      {
        ...emptyPreferencesFormValues,
        preferredTheme: "onyx",
        preferredLanguage: "es",
        allowDirectMessagesFrom: "relationships",
      },
      {
        preferredTheme: true,
      },
    );

    expect(patch).toEqual({
      preferredTheme: "onyx",
    });
  });

  it("includes language when dirty", () => {
    const patch = mapPreferencesFormValuesToPatch(
      { ...emptyPreferencesFormValues, preferredLanguage: "es" },
      { preferredLanguage: true },
    );
    expect(patch.preferredLanguage).toBe("es");
  });
});
