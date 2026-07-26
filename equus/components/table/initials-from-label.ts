/**
 * Initials for table avatar fallbacks (Admin History SoT).
 */

export function initialsFromLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—") return "?";
  const parts = trimmed.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}
