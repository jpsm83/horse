import { cookies } from "next/headers";
import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { refreshSchema } from "@/lib/validations/auth.ts";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import { attachSessionCookies } from "@/lib/auth/establishSession.ts";
import * as authService from "@/lib/services/authService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const body = await request.json().catch(() => ({}));
    const parsed = refreshSchema.parse(body);
    const cookieStore = await cookies();
    const refreshToken =
      parsed.refreshToken ?? cookieStore.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      throw new (await import("@/lib/api/errors.ts")).ApiError(
        401,
        "No refresh token provided",
        "UNAUTHORIZED",
      );
    }

    const tokens = await authService.refresh(refreshToken);
    const response = ok(tokens);
    attachSessionCookies(response, tokens);
    return response;
  });
}
