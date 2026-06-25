import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requestEmailSchema } from "@/lib/validations/auth.ts";
import { GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE } from "@/lib/auth/requestEmailConfirmation.ts";
import { handleRequestPasswordReset } from "@/lib/auth/requestPasswordReset.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const { email } = requestEmailSchema.parse(await request.json());
    const result = await handleRequestPasswordReset(email);

    if (result.kind === "server_error_500") {
      throw new ApiError(500, result.message, "INTERNAL_ERROR");
    }

    return ok({ message: result.message || GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE });
  });
}
