/**
 * Transport routes — creation and owned-list.
 *
 * `POST` `/api/v1/transports` — create a transport company owned by the
 * authenticated user.
 * `GET`  `/api/v1/transports?mine=true` — list transports owned by the user.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createTransportSchema } from "@/lib/validations/transport.ts";
import * as transportService from "@/lib/services/transportService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createTransportSchema.parse(await request.json());
    const transport = await transportService.createTransport(session.id, input);
    return ok({ transport }, 201);
  });
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const data = await transportService.listTransportsForOwner(session.id, page, limit);
    return ok(data);
  });
}
