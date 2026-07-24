/**
 * Pure merge helper for primaryDiscipline → disciplines migration.
 * Used by the one-time script and covered by unit tests.
 */

export function mergePrimaryDisciplineIntoDisciplines(
  primaryDiscipline: string | null | undefined,
  disciplines: string[] | null | undefined,
): string[] {
  const existing = Array.isArray(disciplines) ? [...disciplines] : [];
  if (
    typeof primaryDiscipline === "string" &&
    primaryDiscipline.length > 0 &&
    !existing.includes(primaryDiscipline)
  ) {
    existing.push(primaryDiscipline);
  }
  return existing;
}
