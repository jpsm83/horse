import { randomUUID } from "node:crypto";

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
    const allowedTypes = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml",
    ];

    if (file.size > maxSize) {
      throw new ApiError(400, `File ${file.name} exceeds 10MB limit`, "FILE_TOO_LARGE");
    }

    const isAllowed = allowedTypes.some((t) => file.type.startsWith(t));
    if (!isAllowed) {
      throw new ApiError(400, `File ${file.name} has an unsupported type`, "INVALID_FILE_TYPE");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    const basePath = buildCloudinaryPath(`/horses/${horseId}/documents`);
    const publicId = randomUUID();

    let result: { secure_url: string; public_id: string };
    try {
      result = await cloudinary.uploader.upload(dataUri, {
        invalidate: true,
        folder: basePath,
        public_id: publicId,
        resource_type: "auto",
      });
    } catch (err: unknown) {
      const e = err as { message?: string; name?: string; http_code?: number };
      throw new ApiError(
        e.http_code ?? 500,
        e.message || e.name || "Cloudinary upload failed",
        "UPLOAD_FAILED",
      );
    }

    const doc = await docService.createHorseDocument(session.id, horseId, {
      documentType,
      title: title.trim(),
      description: description?.trim() || undefined,
      fileUrl: result.secure_url,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      storagePublicId: result.public_id,
    });

    return ok({ document: doc }, 201);
  });
}
