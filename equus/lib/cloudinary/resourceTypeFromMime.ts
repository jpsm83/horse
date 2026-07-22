/** Maps MIME types to Cloudinary delivery resource_type (image | video | raw). */
export function cloudinaryResourceTypeFromMime(
  mimeType?: string,
): "image" | "video" | "raw" {
  if (!mimeType) return "raw";
  if (mimeType.startsWith("image/") || mimeType === "application/pdf") return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
}
