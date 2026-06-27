import { describe, expect, it } from "vitest";

import { buildAddressGeocodeQuery } from "@/lib/utils/buildAddressGeocodeQuery.ts";

describe("buildAddressGeocodeQuery", () => {
  it("returns empty string when address is undefined", () => {
    expect(buildAddressGeocodeQuery(undefined, "en")).toBe("");
  });

  it("builds street-first comma-joined query with localized country label", () => {
    const query = buildAddressGeocodeQuery(
      {
        street: "Main",
        buildingNumber: "1",
        city: "Lisbon",
        state: "Lisbon",
        postCode: "1000",
        region: "Greater Lisbon",
        country: "PT",
      },
      "en",
    );

    expect(query).toContain("Main");
    expect(query).toContain("1");
    expect(query).toContain("Lisbon");
    expect(query).toContain("1000");
    expect(query).toContain("Portugal");
    expect(query.indexOf("Main")).toBeLessThan(query.indexOf("Lisbon"));
  });

  it("omits door and complement from the query string", () => {
    const query = buildAddressGeocodeQuery(
      {
        street: "Main",
        buildingNumber: "1",
        city: "Lisbon",
        country: "PT",
        doorNumber: "2A",
        complement: "Floor 2",
      },
      "en",
    );

    expect(query).not.toContain("2A");
    expect(query).not.toContain("Floor 2");
  });
});
