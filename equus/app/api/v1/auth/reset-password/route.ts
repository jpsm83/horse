import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { resetPasswordSchema } from "@/lib/validations/auth.ts";
import { handleResetPassword } from "@/lib/auth/resetPassword.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const { token, newPassword } = resetPasswordSchema.parse(await request.json());
    const result = await handleResetPassword(token, newPassword);

    if (result.kind === "client_error") {
      throw new ApiError(400, result.message, "BAD_REQUEST");
    }
    if (result.kind === "server_error_500") {
      throw new ApiError(500, result.message, "INTERNAL_ERROR");
    }

    return ok({ message: result.message });
  });
}
