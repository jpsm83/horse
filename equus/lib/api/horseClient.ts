/**
 * Horse REST client — browser calls to `/api/v1/horses`.
 *
 * Uses cookie auth via shared fetch helpers; route handlers own business logic.
 */

import { resetOptionalUserCache } from "@/lib/api/authClient.ts";
import type { PublicRelationship } from "@/lib/api/authClient.ts";
import type { PublicOwnershipTransfer } from "@/lib/services/ownershipTransferService.ts";
import type { CreateHorsePayload } from "@/lib/utils/horseFormMapping.ts";

type ApiSuccess<T> = { data: T };
type ApiErrorBody = { error?: { code?: string; message?: string } };

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

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok) {
    const message =
      "error" in body && body.error?.message
        ? body.error.message
        : "Request failed";
    const code =
      "error" in body && body.error?.code
        ? body.error.code
        : `HTTP_${response.status}`;
    throw new HorseClientError(response.status, message, code);
  }

  return (body as ApiSuccess<T>).data;
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  let response = await fetch(input, { ...init, credentials: "include" });

  if (response.status === 401) {
    const refreshed = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      response = await fetch(input, { ...init, credentials: "include" });
    }
  }

  return response;
}

/** Create a horse for the authenticated user (main owner). */
export async function createHorse(
  input: CreateHorsePayload,
): Promise<{ horse: CreatedHorse }> {
  const response = await apiFetch("/api/v1/horses", {
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
  isMainOwner: boolean;
  coOwners: Array<{
    userId: string;
    label: string;
    ownershipPercentage: number;
  }>;
};

/** Load a horse the authenticated user owns (main owner or co-owner). */
export async function fetchHorseForOwner(horseId: string): Promise<OwnerHorseSummary> {
  const response = await apiFetch(`/api/v1/horses/${encodeURIComponent(horseId)}/owner`);
  const data = await parseApiResponse<{ horse: OwnerHorseSummary }>(response);
  return data.horse;
}

/** Pending ownership transfer invites sent by the main owner for this horse. */
export async function fetchPendingSentOwnershipTransfers(
  horseId: string,
): Promise<PublicOwnershipTransfer[]> {
  const response = await apiFetch(
    `/api/v1/horses/${encodeURIComponent(horseId)}/ownership-transfers?status=pending`,
  );
  const data = await parseApiResponse<{ transfers: PublicOwnershipTransfer[] }>(response);
  return data.transfers;
}

/** Pending relationship invites sent by the owner for this horse. */
export async function fetchPendingSentRelationships(
  horseId: string,
): Promise<PublicRelationship[]> {
  const response = await apiFetch(
    `/api/v1/horses/${encodeURIComponent(horseId)}/relationships?status=pending`,
  );
  const data = await parseApiResponse<{ relationships: PublicRelationship[] }>(response);
  return data.relationships;
}
