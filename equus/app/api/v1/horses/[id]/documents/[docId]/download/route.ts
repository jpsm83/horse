import connectDb from "@/lib/db.ts";
import { fail } from "@/lib/api/response.ts";
import { ApiError, toHttpError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as docService from "@/lib/services/horseDocumentService.ts";

type RouteContext = { params: Promise<{ id: string; docId: string }> };

type FetchResult =
  | { ok: true; response: Response }
  | { ok: false; lastStatus: number | null };

async function fetchFirstOk(urls: string[]): Promise<FetchResult> {
  let lastStatus: number | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) return { ok: true, response };
      lastStatus = response.status;
      console.error(
        `[document download] Cloudinary fetch failed: status=${response.status} url=${url}`,
      );
    } catch (error) {
      console.error(`[document download] Cloudinary fetch error: url=${url}`, error);
    }
  }

  return { ok: false, lastStatus };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId, docId } = await context.params;

    const meta = await docService.getHorseDocumentDownloadMeta(session.id, horseId, docId);
    const fetchResult = await fetchFirstOk(meta.downloadUrls);

    if (!fetchResult.ok) {
      const statusSuffix =
        fetchResult.lastStatus != null ? ` (last status: ${fetchResult.lastStatus})` : "";
      throw new ApiError(502, `Storage error${statusSuffix}`, "STORAGE_ERROR");
    }

    const blob = await fetchResult.response.blob();

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": meta.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(meta.fileName)}"`,
      },
    });
  } catch (error) {
    return fail(toHttpError(error));
  }
}
