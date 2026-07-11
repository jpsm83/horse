import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import {
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  verifyAccessToken,
} from "@/lib/auth/jwt.ts";
import { assertUserAccountActive } from "@/lib/auth/session.ts";
import { touchUserLastActiveAt } from "@/lib/auth/touchUserLastActive.ts";
import type { AuthUser } from "@/lib/auth/types.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();

    let user: AuthUser | null = null;
    const token = getAccessTokenFromRequest(request);

    if (token) {
      try {
        user = await verifyAccessToken(token);
        await assertUserAccountActive(user.id);
        touchUserLastActiveAt(user.id);
      } catch {
        // Token expired, invalid, or account inactive — user stays null
      }
    }

    const canRefresh = !user && Boolean(getRefreshTokenFromRequest(request));

    return ok({ user, canRefresh });
  });
}
