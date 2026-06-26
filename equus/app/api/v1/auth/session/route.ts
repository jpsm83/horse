import { getServerSession } from "next-auth";

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { authOptions } from "@/lib/auth/auth.ts";
import { attachSessionCookies, establishSession } from "@/lib/auth/establishSession.ts";

export async function POST() {
  return withRoute(async () => {
    await connectDb();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      throw new ApiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const tokens = await establishSession(userId);
    const response = ok({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
    attachSessionCookies(response, tokens);
    return response;
  });
}
