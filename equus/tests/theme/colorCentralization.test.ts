/**
 * Fails when raw palette utilities, hex colors, or black/white utilities
 * creep back into product UI / email templates.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const equusRoot = join(__dirname, "../..");

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/;
const PALETTE_RE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:orange|amber|red|green|blue|yellow|purple|pink|gray|slate|zinc|neutral|stone|rose|emerald|sky|indigo|violet|fuchsia|lime|teal|cyan)-[0-9]{2,3}\b/;
const RAW_BW_RE =
  /\b(?:bg|text|border)-(?:black|white)(?:\/[0-9]+)?\b/;

const HEX_ALLOWLIST = new Set([
  join("components", "icons", "google-icon.tsx"),
  join("lib", "theme", "nonCssColors.ts"),
]);

const SCAN_DIRS = [
  join(equusRoot, "components"),
  join(equusRoot, "app"),
  join(equusRoot, "lib", "email"),
  join(equusRoot, "lib", "seo"),
];

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      out.push(...walkTsFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function toPosixRel(abs: string): string {
  return relative(equusRoot, abs).split(sep).join("/");
}

describe("color centralization audit", () => {
  const files = SCAN_DIRS.flatMap((dir) => walkTsFiles(dir));

  it("has files to scan", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("forbids raw Tailwind palette classes in scanned TS/TSX", () => {
    const hits: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const match = content.match(PALETTE_RE);
      if (match) {
        hits.push(`${toPosixRel(file)}: ${match[0]}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("forbids bg/text/border black|white utilities in scanned TS/TSX", () => {
    const hits: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const match = content.match(RAW_BW_RE);
      if (match) {
        hits.push(`${toPosixRel(file)}: ${match[0]}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("forbids hex literals outside allowlist", () => {
    const hits: string[] = [];
    for (const file of files) {
      const rel = relative(equusRoot, file);
      if (HEX_ALLOWLIST.has(rel)) continue;
      const content = readFileSync(file, "utf8");
      const match = content.match(HEX_RE);
      if (match) {
        hits.push(`${toPosixRel(file)}: ${match[0]}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
