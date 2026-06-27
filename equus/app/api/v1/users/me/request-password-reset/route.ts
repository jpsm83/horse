/**
 * Authenticated password reset for the current user (`POST /api/v1/users/me/request-password-reset`).
 */

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE } from "@/lib/auth/requestEmailConfirmation.ts";
import { handleRequestPasswordReset } from "@/lib/auth/requestPasswordReset.ts";
import * as userService from "@/lib/services/userService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const user = await userService.findById(session.id);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }

    const email =
      typeof user.personalDetails?.email === "string"
        ? user.personalDetails.email
        : session.email;

    const result = await handleRequestPasswordReset(email);

    if (result.kind === "server_error_500") {
      throw new ApiError(500, result.message, "INTERNAL_ERROR");
    }

    return ok({ message: result.message || GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE });
  });
}
