/**
 * Multipart profile form parser — `PATCH /api/v1/users/me` with avatar upload.
 * Profile fields are a single JSON `profile` field; image is `imageUrl`.
 */

import type { z } from "zod";
import type { UploadInputFile } from "@/lib/cloudinary/types.ts";
import { updatePersonalDetailsSchema } from "@/lib/validations/user.ts";

type UpdatePersonalDetailsInput = z.infer<typeof updatePersonalDetailsSchema>;

export async function parseProfileFormData(request: Request): Promise<{
  profile?: UpdatePersonalDetailsInput;
  imageFile?: UploadInputFile;
}> {
  const formData = await request.formData();
  let imageFile: UploadInputFile | undefined;

  const fileEntry = formData.get("imageUrl");
  if (fileEntry instanceof File && fileEntry.size > 0) {
    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    imageFile = {
      buffer,
      mimeType: fileEntry.type || "application/octet-stream",
      filename: fileEntry.name,
    };
  }

  let profile: UpdatePersonalDetailsInput | undefined;
  const profileJson = formData.get("profile");
  if (typeof profileJson === "string" && profileJson.trim() !== "") {
    profile = updatePersonalDetailsSchema.parse(JSON.parse(profileJson));
  }

  return { profile, imageFile };
}

/** Parse a multipart request that contains only a profile image (`imageUrl` field). */
export async function parseProfileImageFormData(request: Request): Promise<UploadInputFile> {
  const formData = await request.formData();
  const fileEntry = formData.get("imageUrl");

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    throw new Error("Profile image file is required (field: imageUrl)");
  }

  return {
    buffer: Buffer.from(await fileEntry.arrayBuffer()),
    mimeType: fileEntry.type || "application/octet-stream",
    filename: fileEntry.name,
  };
}
