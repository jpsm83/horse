/**
 * UI REST boundary — pages/layouts/components/hooks must not runtime-import
 * services or models. Only app/api route handlers may.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");

const SCAN_DIRS = ["app", "components", "hooks"];

export const FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST = [] as const;

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api" && path.relative(ROOT, dir).replaceAll("\\", "/") === "app") {
        continue;
      }
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function toPosix(file: string): string {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function isForbiddenTarget(spec: string): boolean {
  return spec.startsWith("@/lib/services/") || spec.startsWith("@/models/");
}

function isTypeOnlyImportClause(clause: string): boolean {
  const trimmed = clause.trim();
  if (/^type\s/.test(trimmed)) return true;

  const namedMatch = trimmed.match(/^\{([\s\S]*)\}$/);
  if (!namedMatch) return false;

  const specifiers = namedMatch[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    specifiers.length > 0 &&
    specifiers.every((specifier) => /^type\s+/.test(specifier))
  );
}

function runtimeImportTargets(source: string): string[] {
  const hits: string[] = [];

  const importRe =
    /(?:^|\n)import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(source))) {
    const isTypeOnly =
      Boolean(match[1]) || isTypeOnlyImportClause(match[2]);
    if (isTypeOnly) continue;
    const spec = match[3];
    if (isForbiddenTarget(spec)) hits.push(spec);
  }

  const dynamicRe = /(?:await\s+)?import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = dynamicRe.exec(source))) {
    const spec = match[1];
    if (!isForbiddenTarget(spec)) continue;

    const before = source.slice(0, match.index);
    if (/:\s*$/.test(before) || /typeof\s+$/.test(before)) continue;

    const after = source.slice(match.index + match[0].length);
    if (!match[0].includes("await") && /^\.\s*[A-Z]/.test(after)) continue;

    hits.push(spec);
  }

  return hits;
}

describe("UI REST boundary", () => {
  it("forbids runtime service/model imports outside app/api, except the shrinking allowlist", () => {
    const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
    const violations: string[] = [];
    const allow = new Set<string>(FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST);

    for (const file of files) {
      const rel = toPosix(file);
      const hits = runtimeImportTargets(fs.readFileSync(file, "utf8"));
      if (hits.length === 0) continue;
      if (allow.has(rel)) continue;
      violations.push(`${rel} → ${hits.join(", ")}`);
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("allowlist is empty when all UI bypasses are gone", () => {
    expect(FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST).toEqual([]);
  });
});
