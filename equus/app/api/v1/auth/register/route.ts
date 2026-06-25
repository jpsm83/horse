import { NextResponse } from "next/server";
import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { registerSchema } from "@/lib/validations/auth.ts";
import { setRefreshCookie } from "@/lib/auth/jwt.ts";
import * as authService from "@/lib/services/authService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const input = registerSchema.parse(await request.json());
    const result = await authService.register(input);
    const response = ok(
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
      201,
    );
    setRefreshCookie(response, result.refreshToken);
    return response;
  });
}
