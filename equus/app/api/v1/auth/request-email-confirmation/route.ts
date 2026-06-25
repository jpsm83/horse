import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requestEmailSchema } from "@/lib/validations/auth.ts";
import {
  GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE,
  handleRequestEmailConfirmation,
} from "@/lib/auth/requestEmailConfirmation.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const { email } = requestEmailSchema.parse(await request.json());
    const result = await handleRequestEmailConfirmation(email);

    if (result.kind === "already_verified_400") {
      throw new ApiError(400, result.message, "BAD_REQUEST");
    }
    if (result.kind === "server_error_500") {
      throw new ApiError(500, result.message, "INTERNAL_ERROR");
    }

    return ok({ message: result.message || GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE });
  });
}
