import { ApiError } from "../api/errors.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "./jwt.ts";
import type { AuthUser } from "./types.ts";

export async function requireAuthFromRequest(request: Request): Promise<AuthUser> {
  const token = getAccessTokenFromRequest(request);

  if (!token) {
    throw new ApiError(401, "No access token provided", "UNAUTHORIZED");
  }

  try {
    return await verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired access token", "UNAUTHORIZED");
  }
}
