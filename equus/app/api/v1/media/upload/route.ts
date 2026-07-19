import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { randomUUID } from "node:crypto";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { buildCloudinaryPath } from "@/lib/cloudinary/constants.ts";
import { v2 as cloudinary } from "cloudinary";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    await requireAuthFromRequest(request);

    configureCloudinary();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      throw new ApiError(400, "No files provided", "VALIDATION_ERROR");
    }

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/", "video/", "application/pdf"];

    for (const file of files) {
      if (file.size > maxSize) {
        throw new ApiError(400, `File ${file.name} exceeds 10MB limit`, "FILE_TOO_LARGE");
      }

      const isAllowed = allowedTypes.some((t) => file.type.startsWith(t));
      if (!isAllowed) {
        throw new ApiError(400, `File ${file.name} has an unsupported type`, "INVALID_FILE_TYPE");
      }
    }

    const basePath = buildCloudinaryPath(`/uploads/${randomUUID()}`);

    const urls = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const publicId = `${basePath}/${randomUUID()}`;

        const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
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

        return result.secure_url as string;
      }),
    );

    return ok({ urls }, 201);
  });
}
