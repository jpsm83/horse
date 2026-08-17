import { describe, expect, it } from "vitest";

import { mergePrimaryDisciplineIntoDisciplines } from "@/lib/utils/mergePrimaryDiscipline.ts";

describe("mergePrimaryDisciplineIntoDisciplines", () => {
  it("appends primary when disciplines is empty", () => {
    expect(mergePrimaryDisciplineIntoDisciplines("Dressage", [])).toEqual(["Dressage"]);
  });

  it("does not duplicate an existing primary", () => {
    expect(mergePrimaryDisciplineIntoDisciplines("Dressage", ["Dressage", "Jumping"])).toEqual([
      "Dressage",
      "Jumping",
    ]);
  });

  it("returns existing list when primary is missing", () => {
    expect(mergePrimaryDisciplineIntoDisciplines(undefined, ["Jumping"])).toEqual(["Jumping"]);
    expect(mergePrimaryDisciplineIntoDisciplines("", ["Jumping"])).toEqual(["Jumping"]);
  });

  it("handles nullish disciplines", () => {
    expect(mergePrimaryDisciplineIntoDisciplines("Eventing", undefined)).toEqual(["Eventing"]);
  });
});
