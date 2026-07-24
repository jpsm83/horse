/**
 * Horse unique identity helpers — registry / microchip / passport.
 *
 * Values are persisted normalized (lowercase, alphanumeric only) so uniqueness
 * and search stay aligned.
 */

export const HORSE_IDENTITY_REQUIRED_MESSAGE =
  "At least one of registry ID, microchip ID, or passport number is required";

export const HORSE_IDENTITY_DUPLICATE_MESSAGE =
  "A horse with this registry ID, microchip, or passport number already exists";

export type HorseIdentityFields = {
  registryId?: string | null;
  microchipId?: string | null;
  passportNumber?: string | null;
};

/** Lowercase and strip whitespace / symbols — keep only [a-z0-9]. */
export function normalizeHorseIdentityValue(raw: string | undefined | null): string {
  if (raw == null) return "";
  return String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function hasAtLeastOneHorseIdentity(ids: HorseIdentityFields): boolean {
  return Boolean(
    normalizeHorseIdentityValue(ids.registryId) ||
      normalizeHorseIdentityValue(ids.microchipId) ||
      normalizeHorseIdentityValue(ids.passportNumber),
  );
}

/** Returns only non-empty normalized identity fields (omit empties for sparse unique indexes). */
export function normalizeHorseIdentityFields(ids: HorseIdentityFields): {
  registryId?: string;
  microchipId?: string;
  passportNumber?: string;
} {
  const out: {
    registryId?: string;
    microchipId?: string;
    passportNumber?: string;
  } = {};

  const registryId = normalizeHorseIdentityValue(ids.registryId);
  if (registryId) out.registryId = registryId;

  const microchipId = normalizeHorseIdentityValue(ids.microchipId);
  if (microchipId) out.microchipId = microchipId;

  const passportNumber = normalizeHorseIdentityValue(ids.passportNumber);
  if (passportNumber) out.passportNumber = passportNumber;

  return out;
}
