import { describe, expect, it } from "vitest";

import {
  getCountrySelectOptions,
  getLanguageSelectOptions,
} from "@/lib/profile/selectOptions.ts";

describe("selectOptions", () => {
  it("builds language options with flag codes", () => {
    const options = getLanguageSelectOptions({
      en: "English",
      es: "Español",
    });

    expect(options).toEqual([
      { value: "en", label: "English", flagCode: "US" },
      { value: "es", label: "Español", flagCode: "ES" },
    ]);
  });

  it("builds country options with matching flag codes", () => {
    const options = getCountrySelectOptions("en");
    const portugal = options.find((option) => option.value === "PT");

    expect(portugal).toMatchObject({
      value: "PT",
      label: "Portugal",
      flagCode: "PT",
    });
  });
});
