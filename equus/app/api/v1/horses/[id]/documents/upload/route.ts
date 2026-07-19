import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { buildCloudinaryPath } from "@/lib/cloudinary/constants.ts";
import { v2 as cloudinary } from "cloudinary";
import * as docService from "@/lib/services/horseDocumentService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId } = await context.params;

    configureCloudinary();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;

    if (!file) throw new ApiError(400, "No file provided", "VALIDATION_ERROR");
    if (!documentType) throw new ApiError(400, "Document type is required", "VALIDATION_ERROR");
    if (!title?.trim()) throw new ApiError(400, "Title is required", "VALIDATION_ERROR");

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument", "text/plain", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml"];

    if (file.size > maxSize) {
      throw new ApiError(400, `File ${file.name} exceeds 10MB limit`, "FILE_TOO_LARGE");
    }

    const isAllowed = allowedTypes.some((t) => file.type.startsWith(t));
    if (!isAllowed) {
      throw new ApiError(400, `File ${file.name} has an unsupported type`, "INVALID_FILE_TYPE");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const basePath = buildCloudinaryPath(`/horses/${horseId}/documents`);
    const publicId = `${basePath}/${Date.now()}`;

    console.log("[documents/upload] Uploading:", {
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      basePath,
      publicId,
    });

    let result: Record<string, unknown>;
    try {
      result = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { invalidate: true, folder: basePath, public_id: publicId, resource_type: "auto" },
        (error, res) => {
          if (error) {
            const e = error as { message?: string; name?: string; http_code?: number };
            reject(new ApiError(e.http_code ?? 500, e.message || e.name || "Cloudinary upload failed"));
          } else {
            resolve(res!);
          }
        }
        );
        stream.end(buffer);
      });
      console.log("[documents/upload] Cloudinary upload OK:", result.public_id);
    } catch (err: unknown) {
      console.error("[documents/upload] Cloudinary upload FAILED");
      console.error("  typeof:", typeof err);
      console.error("  toString:", Object.prototype.toString.call(err));
      if (err instanceof Error) {
        console.error("  message:", err.message);
        console.error("  stack:", err.stack);
        console.error("  keys:", Object.keys(err));
      }
      console.error("  JSON:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      console.error("  raw error:", err);
      throw err;
    }

    let doc;
    try {
      doc = await docService.createHorseDocument(session.id, horseId, {
        documentType,
        title: title.trim(),
        description: description?.trim() || undefined,
        fileUrl: result.secure_url as string,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        storagePublicId: result.public_id as string,
      });
      console.log("[documents/upload] DB create OK:", doc.id);
    } catch (err: unknown) {
      console.error("[documents/upload] DB createHorseDocument FAILED");
      console.error("  typeof:", typeof err);
      console.error("  toString:", Object.prototype.toString.call(err));
      if (err instanceof Error) {
        console.error("  message:", err.message);
        console.error("  stack:", err.stack);
      }
      console.error("  raw error:", err);
      throw err;
    }

    return ok({ document: doc }, 201);
  });
}
