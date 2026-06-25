import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const user = await requireAuthFromRequest(request);
    return ok({ user });
  });
}
