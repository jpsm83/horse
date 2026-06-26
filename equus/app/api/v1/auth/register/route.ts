import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { registerSchema } from "@/lib/validations/auth.ts";
import { attachSessionCookies } from "@/lib/auth/establishSession.ts";
import * as authService from "@/lib/services/authService.ts";
import { attachLocaleCookie } from "@/i18n/attachLocaleCookie.ts";
import { localeFromAcceptLanguage } from "@/i18n/resolveLocale.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const input = registerSchema.parse(await request.json());
    const preferredLanguage =
      input.preferredLanguage ??
      localeFromAcceptLanguage(request.headers.get("accept-language"));

    const tokens = await authService.register({ ...input, preferredLanguage });
    const response = ok(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: tokens.user,
      },
      201,
    );
    attachSessionCookies(response, tokens);
    attachLocaleCookie(response, tokens.user.preferredLanguage);
    return response;
  });
}
