/**
 * Ensures `lib/theme/nonCssColors.ts` stays aligned with `:root` hex in globals.css.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { nonCssColors } from "@/lib/theme/nonCssColors";

const globalsPath = resolve(__dirname, "../../../app/globals.css");

function extractRootBlock(css: string): string {
  const match = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!match) {
    throw new Error("Could not find :root block in globals.css");
  }
  return match[1];
}

function readRootVar(rootBlock: string, name: string): string {
  const re = new RegExp(`--${name}:\\s*([^;]+);`);
  const match = rootBlock.match(re);
  if (!match) {
    throw new Error(`Missing --${name} in :root`);
  }
  return match[1].trim().toLowerCase();
}

describe("nonCssColors sync with globals.css :root", () => {
  const rootBlock = extractRootBlock(readFileSync(globalsPath, "utf8"));

  const scalarPairs: Array<[keyof typeof nonCssColors, string]> = [
    ["primary", "primary"],
    ["primaryForeground", "primary-foreground"],
    ["muted", "muted"],
    ["border", "border"],
    ["foreground", "foreground"],
    ["mutedForeground", "muted-foreground"],
    ["link", "primary"],
    ["browserThemeColor", "primary"],
    ["excelGridline", "excel-gridline"],
    ["excelHeaderFill", "excel-header-fill"],
  ];

  it.each(scalarPairs)("%s matches --%s", (key, cssName) => {
    const expected = nonCssColors[key];
    if (typeof expected !== "string") {
      throw new Error(`Expected string for ${String(key)}`);
    }
    expect(readRootVar(rootBlock, cssName)).toBe(expected.toLowerCase());
  });

  it("badge band pairs match :root", () => {
    for (const [key, band] of Object.entries(nonCssColors.badgeBands)) {
      expect(readRootVar(rootBlock, `badge-band-${key}`)).toBe(
        band.background.toLowerCase(),
      );
      expect(readRootVar(rootBlock, `badge-band-${key}-foreground`)).toBe(
        band.foreground.toLowerCase(),
      );
    }
  });
});
