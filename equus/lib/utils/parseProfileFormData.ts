import type { z } from "zod";
import type { UploadInputFile } from "@/lib/cloudinary/types.ts";
import { updatePersonalDetailsSchema } from "@/lib/validations/user.ts";

type UpdatePersonalDetailsInput = z.infer<typeof updatePersonalDetailsSchema>;

const PROFILE_FIELD_KEYS = [
  "username",
  "idType",
  "idNumber",
  "firstName",
  "lastName",
  "nationality",
  "gender",
  "birthDate",
  "phoneNumber",
  "bio",
  "preferredLanguage",
  "timezone",
] as const;

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

  const raw: Record<string, unknown> = {};

  for (const key of PROFILE_FIELD_KEYS) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") {
      raw[key] = value;
    }
  }

  const addressValue = formData.get("address");
  if (typeof addressValue === "string" && addressValue.trim() !== "") {
    raw.address = JSON.parse(addressValue);
  }

  let profile: UpdatePersonalDetailsInput | undefined;
  if (Object.keys(raw).length > 0) {
    profile = updatePersonalDetailsSchema.parse(raw);
  }

  return { profile, imageFile };
}

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
