import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = ["messages/en.json", "messages/es.json"];

const MOJIBAKE_EMDASH = /\u00e2\u20ac[\u201c\u201d]/gi;
const MOJIBAKE_ELLIPSIS = /\u00e2\u20ac\u00a6/g;
const MOJIBAKE_ELLIPSIS_ALT = /\u00e2\u20ac\u2026/g;

function fixString(value) {
  if (typeof value !== "string") return value;

  let out = value;

  out = out
    .replace(MOJIBAKE_EMDASH, " - ")
    .replace(MOJIBAKE_ELLIPSIS, "...")
    .replace(MOJIBAKE_ELLIPSIS_ALT, "...")
    .replace(/\u00e2\u20ac\u2019/g, "'")
    .replace(/\u00e2\u20ac\u0153/g, '"')
    .replace(/\u00e2\u20ac\u009d/g, '"');

  out = out.replace(/\u00c2\u00bf/g, "¿").replace(/\u00c2\u00a1/g, "¡");
  out = out.replace(/Â¿/g, "¿").replace(/Â¡/g, "¡");

  if (/Ã/.test(out)) {
    try {
      const decoded = Buffer.from(out, "latin1").toString("utf8");
      if (!decoded.includes("\uFFFD")) out = decoded;
    } catch {
      // keep current value
    }
  }

  out = out
    .replace(/\u2026/g, "...")
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, " - ")
    .replace(/\u00a9/g, "(c)")
    .replace(/\(c\) OpenStreetMap/g, "OpenStreetMap")
    .replace(/email⬦/g, "email...")
    .replace(/im\uFFFD!genes/g, "imágenes")
    .replace(/trav\(c\)s/g, "través")
    .replace(/a trav\u00E9s/g, "a través");

  out = out
    .replace(/"\?No /g, '"¿No ')
    .replace(/"\?Ya /g, '"¿Ya ')
    .replace(/"\?Olvidó/g, '"¿Olvidó')
    .replace(/\?No está/g, "¿No está");

  return out;
}

function walk(value) {
  if (typeof value === "string") return fixString(value);
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, entry] of Object.entries(value)) {
      next[key] = walk(entry);
    }
    return next;
  }
  return value;
}

for (const relativePath of files) {
  const filePath = path.join(root, relativePath);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const fixed = walk(data);
  const output = `${JSON.stringify(fixed, null, 4)}\n`;
  const suspicious = output.match(/Ã|â€|Â|€|⬦|\uFFFD|\?No |\?Ya |\?Olvidó|im!genes|trav\(c\)s/g);
  fs.writeFileSync(filePath, output, "utf8");
  console.log(`${relativePath}: suspicious=${suspicious?.length ?? 0}`);
  if (suspicious?.length) console.log([...new Set(suspicious)].join(", "));
}
