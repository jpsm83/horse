import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { registerSchema } from "@/lib/validations/auth.ts";
import { attachSessionCookies } from "@/lib/auth/establishSession.ts";
import * as authService from "@/lib/services/authService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const input = registerSchema.parse(await request.json());
    const tokens = await authService.register(input);
    const response = ok(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: tokens.user,
      },
      201,
    );
    attachSessionCookies(response, tokens);
    return response;
  });
}
