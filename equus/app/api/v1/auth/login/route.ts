import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { loginSchema } from "@/lib/validations/auth.ts";
import { setRefreshCookie } from "@/lib/auth/jwt.ts";
import * as authService from "@/lib/services/authService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const input = loginSchema.parse(await request.json());
    const result = await authService.login(input.email, input.password);
    const response = ok({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
    setRefreshCookie(response, result.refreshToken);
    return response;
  });
}
