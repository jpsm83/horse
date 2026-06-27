import { getServerSession } from "next-auth";

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { authOptions } from "@/lib/auth/auth.ts";
import { attachSessionCookies, establishSession } from "@/lib/auth/establishSession.ts";
import { attachLocaleCookie } from "@/i18n/attachLocaleCookie.ts";
import { localeFromAcceptLanguage } from "@/i18n/resolveLocale.ts";
import * as userService from "@/lib/services/userService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      throw new ApiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const acceptLanguage = request.headers.get("accept-language");
    await userService.ensurePreferredLanguage(
      userId,
      localeFromAcceptLanguage(acceptLanguage),
    );

    const tokens = await establishSession(userId);
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
