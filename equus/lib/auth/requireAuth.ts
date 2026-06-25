import { ApiError } from "../api/errors.ts";
import { verifyAccessToken } from "./jwt.ts";
import type { AuthUser } from "./types.ts";

export async function requireAuthFromRequest(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "No access token provided", "UNAUTHORIZED");
  }

  const token = authHeader.slice(7);

  try {
    return await verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired access token", "UNAUTHORIZED");
  }
}
