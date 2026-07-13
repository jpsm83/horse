import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createHealthRecordSchema } from "@/lib/validations/horseHealth.ts";
import * as healthService from "@/lib/services/horseHealthService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const records = await healthService.listHealthRecords(id);
    return ok({ records });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = createHealthRecordSchema.parse(await request.json());
    const record = await healthService.createHealthRecord(session.id, id, input);
    return ok({ record }, 201);
  });
}
