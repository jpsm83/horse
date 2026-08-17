import { describe, expect, it } from "vitest";

import {
  fromSelectValue,
  selectItemValue,
  toSelectValue,
} from "@/lib/ui/selectEmptyValue.ts";

const EMPTY = "Select...";
const options = [
  { value: "" },
  { value: "mare" },
  { value: "gelding" },
];

describe("selectEmptyValue", () => {
  it("maps form empty string to translated sentinel when empty option exists", () => {
    expect(toSelectValue("", options, EMPTY)).toBe(EMPTY);
  });

  it("maps form empty string to null when no empty option", () => {
    expect(toSelectValue("", [{ value: "mare" }], EMPTY)).toBeNull();
  });

  it("passes through non-empty values", () => {
    expect(toSelectValue("mare", options, EMPTY)).toBe("mare");
  });

  it("maps sentinel and null back to form empty string", () => {
    expect(fromSelectValue(EMPTY, EMPTY)).toBe("");
    expect(fromSelectValue(null, EMPTY)).toBe("");
    expect(fromSelectValue("mare", EMPTY)).toBe("mare");
  });

  it("maps empty option values to sentinel for SelectItem", () => {
    expect(selectItemValue("", EMPTY)).toBe(EMPTY);
    expect(selectItemValue("mare", EMPTY)).toBe("mare");
  });
});
