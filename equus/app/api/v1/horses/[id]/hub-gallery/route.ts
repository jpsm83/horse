/**
 * Horse Hub paginated gallery (guest-safe).
 *
 * `GET` `/api/v1/horses/[id]/hub-gallery` — Hub-visible media page
 * (`page`, `pageSize`, `type=all|photos|videos`). Auth optional.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { readOptionalAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as mediaService from "@/lib/services/mediaService.ts";
import type { HubGalleryTypeFilter } from "@/lib/services/mediaService.ts";

type RouteContext = { params: Promise<{ id: string }> };

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function parseType(raw: string | null): HubGalleryTypeFilter {
  if (raw === "photos" || raw === "videos" || raw === "all") return raw;
  return "all";
}

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const url = new URL(request.url);
    const page = parsePositiveInt(url.searchParams.get("page"), 1);
    const pageSize = parsePositiveInt(url.searchParams.get("pageSize"), 12);
    const type = parseType(url.searchParams.get("type"));

    if (page < 1 || pageSize < 1 || pageSize > 24) {
      throw new ApiError(400, "Invalid page or pageSize", "VALIDATION_ERROR");
    }

    const data = await mediaService.listHorseHubGallery(id, requester.id ?? null, {
      page,
      pageSize,
      type,
    });
    return ok(data);
  });
}
