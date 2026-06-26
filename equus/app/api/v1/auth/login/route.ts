import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { loginSchema } from "@/lib/validations/auth.ts";
import { attachSessionCookies } from "@/lib/auth/establishSession.ts";
import * as authService from "@/lib/services/authService.ts";
import { attachLocaleCookie } from "@/i18n/attachLocaleCookie.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const input = loginSchema.parse(await request.json());
    const tokens = await authService.login(input.email, input.password);
    const response = ok({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
    attachSessionCookies(response, tokens);
    attachLocaleCookie(response, tokens.user.preferredLanguage);
    return response;
  });
}
