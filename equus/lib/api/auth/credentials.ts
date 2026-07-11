import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { setOptionalUserCache } from "@/lib/api/auth/session";
import type { AuthSessionResult } from "@/lib/api/auth/session";

export type { AuthSessionResult };

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<AuthSessionResult> {
  const response = await fetchWithAuth(
    "/api/v1/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    { notifyOnExpired: true },
  );

  const data = await parseApiResponse<AuthSessionResult>(response);
  setOptionalUserCache(data.user);
  return data;
}

export async function registerWithCredentials(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  referralReference?: string;
  preferredLanguage?: string;
  userType?: string;
  businessDetails?: {
    businessName?: string;
    registrationNumber?: string;
    taxId?: string;
    countryOfRegistration?: string;
  };
}): Promise<AuthSessionResult> {
  const response = await fetchWithAuth(
    "/api/v1/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    { notifyOnExpired: true },
  );

  const data = await parseApiResponse<AuthSessionResult>(response);
  setOptionalUserCache(data.user);
  return data;
}

export async function confirmEmail(token: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(
    "/api/v1/auth/confirm-email",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    },
    { notifyOnExpired: true },
  );

  return parseApiResponse<{ message: string }>(response);
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(
    "/api/v1/auth/request-password-reset",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
    { notifyOnExpired: true },
  );

  return parseApiResponse<{ message: string }>(response);
}

/** Send a password set/reset email for the signed-in user (session email only). */
export async function requestPasswordResetForCurrentUser(): Promise<{ message: string }> {
  const response = await fetchWithAuth(
    "/api/v1/users/me/request-password-reset",
    { method: "POST" },
    { notifyOnExpired: true },
  );

  return parseApiResponse<{ message: string }>(response);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await fetchWithAuth(
    "/api/v1/auth/reset-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    },
    { notifyOnExpired: true },
  );

  return parseApiResponse<{ message: string }>(response);
}

export async function requestEmailConfirmation(email: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(
    "/api/v1/auth/request-email-confirmation",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
    { notifyOnExpired: true },
  );

  return parseApiResponse<{ message: string }>(response);
}
