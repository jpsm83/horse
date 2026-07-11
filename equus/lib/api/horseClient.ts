/**
 * @deprecated Use TanStack Query hooks from `hooks/queries/useHorse.ts` instead.
 * Kept for backward compatibility during migration.
 */
import { resetOptionalUserCache } from "@/lib/api/auth/session";
import type { PublicRelationship } from "@/lib/services/relationshipService";
import type { PublicOwnershipTransfer } from "@/lib/services/ownershipTransferService.ts";
import type { CreateHorsePayload } from "@/lib/utils/horseFormMapping.ts";
import { fetchWithAuth, parseApiResponse, FetchError } from "@/lib/api/fetchWithAuth";

export type CreatedHorse = {
  _id: string;
  name: string;
  breed: string;
  sex: string;
  mainOwnerUserId: string;
  createdByUserId: string;
};

export class HorseClientError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(statusCode: number, message: string, code: string) {
    super(message);
    this.name = "HorseClientError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function apiFetchCatch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchWithAuth(input, init);
  } catch (err) {
    if (err instanceof FetchError) {
      throw new HorseClientError(err.statusCode, err.message, err.code);
    }
    throw err;
  }
}

/** Create a horse for the authenticated user (main owner). */
export async function createHorse(
  input: CreateHorsePayload,
): Promise<{ horse: CreatedHorse }> {
  const response = await apiFetchCatch("/api/v1/horses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ horse: CreatedHorse }>(response);
  resetOptionalUserCache();
  return data;
}

export type OwnerHorseSummary = {
  id: string;
  name?: string;
  breed?: string;
  sex?: string;
  registeredName?: string;
  registryId?: string;
  microchipId?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  ageYears?: number;
  color?: string;
  marksDescription?: string;
  heightHands?: number;
  primaryDiscipline?: string;
  disciplines?: string[];
  countryOfBirth?: string;
  importExportStatus?: string;
  estimatedValue?: number;
  valueCurrency?: string;
  saleStatus?: string;
  askingPrice?: number;
  acquisitionDate?: string;
  acquisitionSource?: string;
  showValuePublicly?: boolean;
  pedigree?: Record<string, unknown>;
  profileImageUrl?: string;
  description?: string;
  notes?: string;
  profileVisibility?: string;
  contactDisplay?: Record<string, unknown>;
  isMainOwner: boolean;
  coOwners: Array<{
    userId: string;
    label: string;
    ownershipPercentage: number;
  }>;
};

/** Load a horse the authenticated user owns (main owner or co-owner). */
export async function fetchHorseForOwner(horseId: string): Promise<OwnerHorseSummary> {
  const response = await apiFetchCatch(`/api/v1/horses/${encodeURIComponent(horseId)}/owner`);
  const data = await parseApiResponse<{ horse: OwnerHorseSummary }>(response);
  return data.horse;
}

/** Pending ownership transfer invites sent by the main owner for this horse. */
export async function fetchPendingSentOwnershipTransfers(
  horseId: string,
): Promise<PublicOwnershipTransfer[]> {
  const response = await apiFetchCatch(
    `/api/v1/horses/${encodeURIComponent(horseId)}/ownership-transfers?status=pending`,
  );
  const data = await parseApiResponse<{ transfers: PublicOwnershipTransfer[] }>(response);
  return data.transfers;
}

/** Pending relationship invites sent by the owner for this horse. */
export async function fetchPendingSentRelationships(
  horseId: string,
): Promise<PublicRelationship[]> {
  const response = await apiFetchCatch(
    `/api/v1/horses/${encodeURIComponent(horseId)}/relationships?status=pending`,
  );
  const data = await parseApiResponse<{ relationships: PublicRelationship[] }>(response);
  return data.relationships;
}
