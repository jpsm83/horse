import { describe, expect, it } from "vitest";

import { buildEventContextPrefix } from "@/lib/chat/buildEventContextPrefix.ts";

describe("buildEventContextPrefix", () => {
  it("formats title, horse name, and date", () => {
    const prefix = buildEventContextPrefix({
      title: "Vaccination appt",
      start: "2026-03-12T10:00:00.000Z",
      horseName: "Star",
    });

    expect(prefix).toContain("Re: Vaccination appt on Star");
    expect(prefix).toContain("2026");
  });
});
