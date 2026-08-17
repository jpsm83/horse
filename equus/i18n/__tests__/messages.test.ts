import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function collectKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
      return collectKeys(nested, path);
    }
    return [path];
  });
}

describe("message catalogs", () => {
  const messagesDir = join(process.cwd(), "messages");
  const en = JSON.parse(readFileSync(join(messagesDir, "en.json"), "utf8"));
  const es = JSON.parse(readFileSync(join(messagesDir, "es.json"), "utf8"));

  it("en and es have the same nested keys", () => {
    const enKeys = collectKeys(en).sort();
    const esKeys = collectKeys(es).sort();
    expect(esKeys).toEqual(enKeys);
  });
});
