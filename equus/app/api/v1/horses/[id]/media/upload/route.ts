import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { buildCloudinaryPath } from "@/lib/cloudinary/constants.ts";
import { v2 as cloudinary } from "cloudinary";
import * as mediaService from "@/lib/services/horseMediaService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId } = await context.params;

    configureCloudinary();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const sourceEntityType = (formData.get("sourceEntityType") as string) || "horse";
    const sourceEntityId = formData.get("sourceEntityId") as string | undefined;
    let descriptions: string[] = [];
    try {
      descriptions = JSON.parse((formData.get("descriptions") as string) || "[]");
    } catch {}

    if (files.length === 0) {
      throw new ApiError(400, "No files provided", "VALIDATION_ERROR");
    }

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/", "video/"];

    for (const file of files) {
      if (file.size > maxSize) {
        throw new ApiError(400, `File ${file.name} exceeds 10MB limit`, "FILE_TOO_LARGE");
      }
      const isAllowed = allowedTypes.some((t) => file.type.startsWith(t));
      if (!isAllowed) {
        throw new ApiError(400, `File ${file.name} has an unsupported type`, "INVALID_FILE_TYPE");
      }
    }

    const basePath = buildCloudinaryPath(`/horses/${horseId}/media/${sourceEntityType}`);

    const results = await Promise.all(
      files.map(async (file, i) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
        const publicId = `${basePath}/${Date.now()}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          invalidate: true,
          folder: basePath,
          public_id: publicId,
          resource_type: "auto",
        });

        const isVideo = file.type.startsWith("video/");
        const thumbnailUrl = isVideo
          ? result.secure_url.replace(/\.\w+$/, ".jpg")
          : undefined;

        const visibilityMode = sourceEntityType === "horse" ? "public" : "owner";

        const description = descriptions[i]?.trim() || undefined;

        return mediaService.createMedia(session.id, horseId, {
          type: isVideo ? "video" : "image",
          url: result.secure_url,
          thumbnailUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
          description,
          mimeType: file.type,
          fileSizeBytes: file.size,
          storagePublicId: result.public_id,
          sourceEntityType,
          sourceEntityId,
          visibilityMode,
          isVisibleOnHub: sourceEntityType === "horse",
        });
      }),
    );

    return ok({ media: results }, 201);
  });
}
