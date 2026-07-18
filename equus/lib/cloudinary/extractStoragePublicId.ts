import { CLOUDINARY_UPLOAD_PRESET } from "@/lib/cloudinary/constants.ts";

export function extractStoragePublicId(url: string): string | null {
  const pattern = new RegExp(`${CLOUDINARY_UPLOAD_PRESET}\\/[^.]+`);
  const match = url.match(pattern);
  return match ? match[0] : null;
}
