import { randomUUID } from "node:crypto";

import { v2 as cloudinary } from "cloudinary";
import configureCloudinary from "./cloudinaryConfig.ts";
import { buildCloudinaryPath } from "./constants.ts";
import type { UploadInputFile } from "./types.ts";

const uploadFilesCloudinary = async (params: {
  folder: string;
  filesArr: UploadInputFile[];
  onlyImages?: boolean;
}): Promise<string | string[]> => {
  configureCloudinary();

  if (params.onlyImages) {
    for (const f of params.filesArr) {
      if (!f.mimeType.startsWith("image/")) return "Only images can be uploaded!";
    }
  }

  try {
    const basePath = buildCloudinaryPath(params.folder);

    const uploaded = await Promise.all(
      params.filesArr.map(async (f) => {
        const dataUri = `data:${f.mimeType};base64,${f.buffer.toString("base64")}`;
        const publicId = `${basePath}/${randomUUID()}`;

        // Signed server upload (api_secret) — same folder pattern as health, without
        // upload_preset so the equus preset cannot flatten paths to `equus/{id}` only.
        const res = await cloudinary.uploader.upload(dataUri, {
          invalidate: true,
          folder: basePath,
          public_id: publicId,
          resource_type: "auto",
        });

        if (!res.public_id.startsWith(`${basePath}/`)) {
          throw new Error(`unexpected public_id ${res.public_id}`);
        }

        return res.secure_url;
      }),
    );
    return uploaded;
  } catch (error) {
    const message = (() => {
      if (error instanceof Error) return error.message;
      if (typeof error === "string") return error;
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    })();

    return `Error trying to upload images: ${message || "Unknown error"}`;
  }
};

export default uploadFilesCloudinary;
