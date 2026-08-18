/**
 * Cron trigger — POST /api/v1/cron/waiting-transfer-nags
 *
 * Guarded by CRON_SECRET (Authorization: Bearer or x-cron-secret header).
 */

import connectDb from "@/lib/db.ts";
import { ok, withRoute } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { processWaitingTransferNags } from "@/lib/jobs/processWaitingTransferNags.ts";

function assertCronSecret(request: Request): void {
  const configured = process.env.CRON_SECRET;
  if (!configured) {
    throw new ApiError(503, "Cron secret is not configured", "SERVICE_UNAVAILABLE");
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  const headerSecret = request.headers.get("x-cron-secret") ?? bearer;

  if (headerSecret !== configured) {
    throw new ApiError(401, "Unauthorized", "UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  return withRoute(async () => {
    assertCronSecret(request);
    await connectDb();
    const result = await processWaitingTransferNags();
    return ok(result);
  });
}
