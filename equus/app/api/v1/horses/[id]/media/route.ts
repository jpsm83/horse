import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createMediaSchema } from "@/lib/validations/media.ts";
import * as mediaService from "@/lib/services/mediaService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const items = await mediaService.listMedia(id);
    return ok({ media: items });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = createMediaSchema.parse(await request.json());
    const item = await mediaService.createMedia(session.id, id, input);
    return ok({ media: item }, 201);
  });
}
